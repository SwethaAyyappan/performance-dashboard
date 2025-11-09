"use client";

import { usePerformanceMonitor } from "../../hooks/usePerformanceMonitor";

export default function PerformanceMonitor() {
  const { fps, memory } = usePerformanceMonitor();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        padding: "8px 12px",
        background: "rgba(0,0,0,0.6)",
        border: "1px solid #555",
        borderRadius: 6,
        fontSize: 12,
        color: "#eee",
        zIndex: 9999,
      }}
    >
      <div>FPS: {fps}</div>
      {memory !== null && <div>Mem: {memory.toFixed(1)} MB</div>}
    </div>
  );
}
