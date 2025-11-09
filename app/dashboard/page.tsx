"use client";

import { useMemo, useState, useEffect } from "react";
import { useDataStream } from "../../hooks/useDataStream";
import { aggregateByTime } from "../../lib/performanceUtils";

import LineChart from "../../components/charts/LineChart";
import BarChart from "../../components/charts/BarChart";
import ScatterPlot from "../../components/charts/ScatterPlot";
import Heatmap from "../../components/charts/Heatmap";
import DataTable from "../../components/ui/DataTable";
import FilterPanel from "../../components/controls/FilterPanel";

type Range = "1m" | "5m" | "1h";
const RANGE_CFG: Record<Range, { bucketMs: number; windowMs: number; label: string }> = {
  "1m": { bucketMs: 1_000, windowMs: 60_000, label: "1m (≥1s buckets, adaptive)" },
  "5m": { bucketMs: 5_000, windowMs: 300_000, label: "5m (≥5s buckets, adaptive)" },
  "1h": { bucketMs: 60_000, windowMs: 3_600_000, label: "1h (≥60s buckets, adaptive)" },
};

function InlinePerfBox() {
  const [fps, setFps] = useState(0);
  const [mem, setMem] = useState<number | null>(null);
  useEffect(() => {
    let last = performance.now(), frames = 0, raf = 0;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
        const pm: any = performance;
        if (pm?.memory?.usedJSHeapSize) setMem(pm.memory.usedJSHeapSize / 1024 / 1024);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{
      position: "fixed", bottom: 20, left: 20, zIndex: 99999,
      padding: "8px 12px", borderRadius: 8, color: "#eee",
      background: "rgba(0,0,0,0.7)", border: "1px solid #555", fontSize: 12
    }}>
      <div>FPS: {fps}</div>
      {mem !== null && <div>Mem: {mem.toFixed(1)} MB</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: "#111", border: "1px solid #333", borderRadius: 12,
      padding: "12px 12px 8px", minHeight: 320, display: "flex", flexDirection: "column"
    }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>{title}</h2>
      <div style={{ flex: 1, minHeight: 280 }}>{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<Range>("1m");
  const [rate, setRate] = useState<number>(100); // ms per update (data load control)
  const { bucketMs, windowMs, label } = RANGE_CFG[range];

  const raw = useDataStream(rate);

  const [filters, setFilters] = useState<{ valueMin: number; valueMax: number }>({
    valueMin: -100,
    valueMax: 100,
  });

  const { domainMin, domainMax } = useMemo(() => {
    if (raw.length === 0) return { domainMin: -100, domainMax: 100 };
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < raw.length; i++) {
      const v = raw[i].value;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { domainMin: -100, domainMax: 100 };
    const pad = (max - min) * 0.05 || 1;
    return { domainMin: Math.floor(min - pad), domainMax: Math.ceil(max + pad) };
  }, [raw]);

  const filteredRaw = useMemo(
    () => raw.filter(p => p.value >= filters.valueMin && p.value <= filters.valueMax),
    [raw, filters.valueMin, filters.valueMax]
  );

  const aggregated = useMemo(
    () => aggregateByTime(filteredRaw, bucketMs, windowMs),
    [filteredRaw, bucketMs, windowMs]
  );

  const RangeButton = ({ value }: { value: Range }) => {
    const active = range === value;
    return (
      <button
        onClick={() => setRange(value)}
        style={{
          padding: "8px 12px", borderRadius: 8, marginRight: 10,
          border: active ? "1px solid #999" : "1px solid #444",
          background: active ? "#333" : "#111", color: active ? "#fff" : "#bbb", cursor: "pointer"
        }}
      >
        {value}
      </button>
    );
  };

  return (
    <div style={{ padding: "24px 16px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>Dashboard</h1>
          <div style={{ marginTop: 6, color: "#bbb" }}>
            Range: <b>{range}</b> &nbsp;|&nbsp; {label}
            <br />
            Raw: {raw.length} &nbsp;|&nbsp; Filtered: {filteredRaw.length} &nbsp;|&nbsp; Aggregated: {aggregated.length}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <RangeButton value="1m" />
            <RangeButton value="5m" />
            <RangeButton value="1h" />

            <label style={{ color: "#bbb", display: "flex", alignItems: "center", gap: 8 }}>
              Stream rate:
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                style={{
                  padding: "6px 8px",
                  background: "#111",
                  color: "#eee",
                  border: "1px solid #444",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                <option value={50}>Very Fast (50ms)</option>
                <option value={100}>Fast (100ms)</option>
                <option value={300}>Medium (300ms)</option>
                <option value={1000}>Slow (1000ms)</option>
              </select>
            </label>
          </div>
        </header>

        <section style={{ marginBottom: 16 }}>
          <FilterPanel
            valueMin={filters.valueMin}
            valueMax={filters.valueMax}
            domainMin={domainMin}
            domainMax={domainMax}
            totalCount={raw.length}
            filteredCount={filteredRaw.length}
            onChange={({ valueMin, valueMax }) => setFilters((f) => ({ ...f, valueMin, valueMax }))}
            onReset={() => setFilters({ valueMin: domainMin, valueMax: domainMax })}
          />
        </section>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            alignItems: "stretch",
          }}
        >
          <Card title="Line">
            {aggregated.length < 2 ? (
              <div style={{ padding: 16, color: "#aaa", border: "1px dashed #555", borderRadius: 8 }}>
                Collecting data…
              </div>
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <LineChart data={aggregated} />
              </div>
            )}
          </Card>

          <Card title="Bar">
            <div style={{ width: "100%", height: 280 }}>
              <BarChart data={aggregated} />
            </div>
          </Card>

          <Card title="Scatter">
            <div style={{ width: "100%", height: 280 }}>
              <ScatterPlot data={aggregated} />
            </div>
          </Card>

          <Card title="Heatmap">
            <div style={{ width: "100%", height: 280 }}>
              <Heatmap data={filteredRaw} windowMs={windowMs} cols={480} rows={80} />
            </div>
          </Card>
        </div>

        <section style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Raw Stream (Virtualized)</h2>
          <div style={{ height: 360 }}>
            <DataTable rows={filteredRaw} />
          </div>
        </section>
      </div>

      <InlinePerfBox />
    </div>
  );
}
