"use client";

import { useCallback } from "react";
import type { DataPoint } from "../../lib/types";
import { useChartRenderer } from "../../hooks/useChartRenderer";
import { drawFrame, pixelAlign } from "../../lib/canvasUtils";

export default function BarChart({ data }: { data: DataPoint[] }) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
      ctx.clearRect(0, 0, width, height);
      drawFrame(ctx, width, height);

      const n = data.length;
      if (n === 0) return;

      let min = Infinity, max = -Infinity;
      for (let i = 0; i < n; i++) {
        const v = data[i].value;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) { min -= 1; max += 1; }
      const range = max - min;

      const gap = 2;
      const barW = Math.max(1, width / n - gap);

      ctx.fillStyle = "#e9e9e9";
      for (let i = 0; i < n; i++) {
        const v = data[i].value;
        const h = ((v - min) / range) * height;
        const x = i * (barW + gap);
        const y = height - h;

        const ax = pixelAlign(x);
        const aw = Math.max(1, Math.floor(barW));
        ctx.fillRect(ax, y, aw, h);
      }
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
