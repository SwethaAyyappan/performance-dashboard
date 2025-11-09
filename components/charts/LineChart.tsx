"use client";

import { useCallback } from "react";
import { useChartRenderer } from "../../hooks/useChartRenderer";
import type { DataPoint } from "../../lib/types";
import { drawFrame, drawGrid } from "../../lib/canvasUtils";

export default function LineChart({ data }: { data: DataPoint[] }) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      ctx.clearRect(0, 0, width, height);
      drawGrid(ctx, width, height);
      drawFrame(ctx, width, height);

      const n = data.length;
      if (n < 2) return;

      let min = Infinity, max = -Infinity;
      for (let i = 0; i < n; i++) {
        const v = data[i].value;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) { min -= 1; max += 1; }
      const range = max - min;
      const denom = Math.max(1, n - 1);

      ctx.beginPath();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#ffffff";
      for (let i = 0; i < n; i++) {
        const x = (i / denom) * width;
        const y = height - ((data[i].value - min) / range) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [data]
  );

  const { canvasRef } = useChartRenderer(draw, [data], { animate: false });

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "#111",
        border: "1px solid #333",
      }}
    />
  );
}
