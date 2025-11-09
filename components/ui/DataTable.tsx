// components/ui/DataTable.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualization } from "../../hooks/useVirtualization";
import type { DataPoint } from "../../lib/types";

type Column<T> = {
  key: string;
  header: string;
  width?: number | string;             // px or %
  align?: "left" | "right" | "center";
  render: (row: T, rowIndex: number) => React.ReactNode;
};

type Props = {
  rows: DataPoint[];
  height?: number;            // fallback height if container can't measure
  rowHeight?: number;         // fixed row height in px
  overscan?: number;          // extra rows to render above/below
  className?: string;
};

export default function DataTable({
  rows,
  height = 360,
  rowHeight = 28,
  overscan = 6,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number>(height);
  const [scrollTop, setScrollTop] = useState<number>(0);

  // Columns for DataPoint (timestamp, value)
  const columns: Column<DataPoint>[] = useMemo(
    () => [
      {
        key: "time",
        header: "Time",
        width: "60%",
        render: (r) =>
          new Date(r.timestamp).toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            fractionalSecondDigits: 3,
          }),
      },
      {
        key: "value",
        header: "Value",
        width: "40%",
        align: "right",
        render: (r) => r.value.toFixed(3),
      },
    ],
    []
  );

  // Measure container height with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewportHeight(el.clientHeight);
    });
    ro.observe(el);
    setViewportHeight(el.clientHeight || height);
    return () => ro.disconnect();
  }, [height]);

  // Handle scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      // throttle with rAF for smoother main-thread behavior
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollTop(el.scrollTop));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const { start, end, offset, totalHeight } = useVirtualization({
    total: rows.length,
    rowHeight,
    viewportHeight,
    scrollTop,
    overscan,
  });

  const visibleRows = rows.slice(start, end);

  // Simple zebra + sticky header styles
  const header = (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        display: "grid",
        gridTemplateColumns: columns.map((c) => c.width || "1fr").join(" "),
        gap: 0,
        padding: "8px 12px",
        background: "#151515",
        borderBottom: "1px solid #2a2a2a",
        color: "#e9e9e9",
        fontWeight: 600,
        backdropFilter: "blur(2px)",
      }}
      role="row"
    >
      {columns.map((c) => (
        <div
          key={c.key}
          style={{
            textAlign: c.align || "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          role="columnheader"
        >
          {c.header}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        border: "1px solid #2c2c2c",
        borderRadius: 10,
        background: "#0f0f10",
        // ensure sticky header works with dark bg
        position: "relative",
      }}
      role="table"
      aria-rowcount={rows.length}
    >
      {header}

      {/* Spacer that defines total scroll height */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* Absolutely position the visible window */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offset}px)`,
          }}
        >
          {visibleRows.map((row, i) => {
            const absoluteIndex = start + i;
            return (
              <div
                key={row.timestamp + "-" + absoluteIndex}
                role="row"
                style={{
                  height: rowHeight,
                  display: "grid",
                  gridTemplateColumns: columns.map((c) => c.width || "1fr").join(" "),
                  alignItems: "center",
                  padding: "0 12px",
                  borderBottom: "1px solid #1f1f1f",
                  background:
                    absoluteIndex % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  willChange: "transform",
                }}
              >
                {columns.map((c) => (
                  <div
                    key={c.key}
                    style={{
                      textAlign: c.align || "left",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#e6e6e6",
                      fontSize: 13,
                    }}
                  >
                    {c.render(row, absoluteIndex)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
