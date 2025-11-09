"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  /** current numeric filter range */
  valueMin: number;
  valueMax: number;

  /** global data extent (used to clamp sliders/inputs) */
  domainMin: number;
  domainMax: number;

  /** counts (so this component doesn't scan arrays on every render) */
  totalCount: number;
  filteredCount: number;

  /** called after a short debounce when user changes the range */
  onChange: (next: { valueMin: number; valueMax: number }) => void;

  /** stream pause/resume (optional) */
  paused?: boolean;
  onTogglePaused?: (next: boolean) => void;

  /** reset callback (optional) */
  onReset?: () => void;
};

export default function FilterPanel({
  valueMin,
  valueMax,
  domainMin,
  domainMax,
  totalCount,
  filteredCount,
  onChange,
  paused,
  onTogglePaused,
  onReset,
}: Props) {
  // local UI state (debounced -> onChange)
  const [minLocal, setMinLocal] = useState<number>(valueMin);
  const [maxLocal, setMaxLocal] = useState<number>(valueMax);

  // keep local in sync if parent changes externally
  useEffect(() => setMinLocal(valueMin), [valueMin]);
  useEffect(() => setMaxLocal(valueMax), [valueMax]);

  // debounce
  const rafRef = useRef<number>(0);
  const payloadRef = useRef<{ valueMin: number; valueMax: number } | null>(null);
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const emit = (next: { valueMin: number; valueMax: number }) => {
    payloadRef.current = next;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // micro-debounce using RAF keeps UI snappy
    rafRef.current = requestAnimationFrame(() => {
      if (payloadRef.current) onChange(payloadRef.current);
    });
  };

  const clamp = (v: number) => Math.min(domainMax, Math.max(domainMin, v));

  const commitMin = (v: number) => {
    const min = clamp(v);
    const max = Math.max(min, maxLocal);
    setMinLocal(min);
    setMaxLocal(max);
    emit({ valueMin: min, valueMax: max });
  };

  const commitMax = (v: number) => {
    const max = clamp(v);
    const min = Math.min(minLocal, max);
    setMinLocal(min);
    setMaxLocal(max);
    emit({ valueMin: min, valueMax: max });
  };

  const pct = (v: number) =>
    ((v - domainMin) / Math.max(1e-9, domainMax - domainMin)) * 100;

  const badge = useMemo(() => {
    const pctShown = totalCount ? Math.round((filteredCount / totalCount) * 100) : 0;
    return `${filteredCount.toLocaleString()} / ${totalCount.toLocaleString()} (${pctShown}%)`;
  }, [filteredCount, totalCount]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        padding: 12,
        border: "1px solid #333",
        background: "#0f0f10",
        borderRadius: 12,
      }}
      aria-label="Filter panel"
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600, color: "#eee" }}>Filters</div>
        <div
          title="Rows shown / total"
          style={{
            fontSize: 12,
            color: "#bbb",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid #2b2b2b",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          {badge}
        </div>
      </div>

      {/* Value range inputs */}
      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ color: "#ddd", fontSize: 13 }}>Value range</label>

        {/* Dual inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <NumberInput
            label="Min"
            value={minLocal}
            onChange={commitMin}
            min={domainMin}
            max={domainMax}
          />
          <NumberInput
            label="Max"
            value={maxLocal}
            onChange={commitMax}
            min={domainMin}
            max={domainMax}
          />
        </div>

        {/* Visual slider track (two opposing ranges) */}
        <div style={{ position: "relative", height: 32 }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 6,
              background:
                "linear-gradient(90deg, #1a1a1a, #1a1a1a)",
              border: "1px solid #2b2b2b",
            }}
          />
          {/* shaded selection */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 5,
              bottom: 5,
              left: `${pct(minLocal)}%`,
              width: `${Math.max(0, pct(maxLocal) - pct(minLocal))}%`,
              background: "linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10))",
              borderRadius: 4,
              pointerEvents: "none",
              transition: "left 80ms linear, width 80ms linear",
            }}
          />
          {/* min slider */}
          <input
            type="range"
            aria-label="Minimum value"
            min={domainMin}
            max={domainMax}
            step="any"
            value={minLocal}
            onChange={(e) => commitMin(parseFloat(e.currentTarget.value))}
            style={rangeStyle}
          />
          {/* max slider */}
          <input
            type="range"
            aria-label="Maximum value"
            min={domainMin}
            max={domainMax}
            step="any"
            value={maxLocal}
            onChange={(e) => commitMax(parseFloat(e.currentTarget.value))}
            style={rangeStyle}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {typeof paused === "boolean" && onTogglePaused && (
          <button
            onClick={() => onTogglePaused(!paused)}
            style={btnStyle}
            aria-pressed={paused}
            title="Pause/resume data stream"
          >
            {paused ? "Resume Stream" : "Pause Stream"}
          </button>
        )}
        {onReset && (
          <button onClick={onReset} style={{ ...btnStyle, background: "#171717" }}>
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}

/* ------- tiny UI atoms ------- */

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const [local, setLocal] = useState<string>(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span style={{ color: "#aaa", fontSize: 12 }}>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={local}
        onChange={(e) => setLocal(e.currentTarget.value)}
        onBlur={() => {
          const n = Number(local);
          if (!Number.isFinite(n)) {
            setLocal(String(value));
            return;
          }
          const clamped = Math.min(max, Math.max(min, n));
          if (clamped !== value) onChange(clamped);
          setLocal(String(clamped));
        }}
        style={{
          background: "#0e0e0f",
          color: "#eee",
          border: "1px solid #2b2b2b",
          borderRadius: 8,
          height: 34,
          padding: "0 10px",
          outline: "none",
        }}
      />
    </label>
  );
}

const rangeStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  margin: 0,
  background: "transparent",
  WebkitAppearance: "none",
  appearance: "none",
  pointerEvents: "auto",
};

// button style
const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #2b2b2b",
  background: "#141414",
  color: "#eee",
  cursor: "pointer",
};
