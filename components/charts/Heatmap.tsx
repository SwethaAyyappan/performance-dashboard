"use client";

import { useMemo, useCallback } from "react";
import type { DataPoint } from "../../lib/types";
import { useChartRenderer } from "../../hooks/useChartRenderer";
import { drawFrame, makeGradientPalette } from "../../lib/canvasUtils";

type Props = {
  data: DataPoint[];
  windowMs: number;
  cols?: number;
  rows?: number;
  blur?: number;
  normalize?: "sqrt" | "log" | "linear";
};

export default function Heatmap({
  data,
  windowMs,
  cols = 480,
  rows = 80,
  blur = 3,
  normalize = "log",
}: Props) {
  const grid = useMemo(() => {
    if (!data?.length) return { cols: 0, rows: 0, counts: new Float32Array(0) };

    const end = data[data.length - 1]?.timestamp ?? Date.now();
    const nominalStart = end - windowMs;

    let lo = 0, hi = data.length - 1, lb = data.length;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (data[mid].timestamp >= nominalStart) { lb = mid; hi = mid - 1; }
      else lo = mid + 1;
    }
    const slice = data.slice(Math.max(0, lb)).filter(p => p.timestamp <= end);
    if (!slice.length) return { cols: 0, rows: 0, counts: new Float32Array(0) };

    const actualStart = slice[0].timestamp;
    const span = Math.max(1, Math.min(windowMs, end - actualStart));

    let vmin = Infinity, vmax = -Infinity;
    for (let i = 0; i < slice.length; i++) {
      const v = slice[i].value;
      if (v < vmin) vmin = v;
      if (v > vmax) vmax = v;
    }
    if (vmin === vmax) { vmin -= 1; vmax += 1; }
    const vr = vmax - vmin;

    const counts = new Float32Array(cols * rows);

    for (let i = 0; i < slice.length; i++) {
      const { timestamp: t, value: v } = slice[i];
      const x = Math.min(cols - 1, Math.max(0, Math.floor(((t - actualStart) / span) * cols)));
      const y = Math.min(rows - 1, Math.max(0, Math.floor(((v - vmin) / vr) * rows)));
      const idx = y * cols + x;
      counts[idx] += 1;
      if (y > 0) counts[(y - 1) * cols + x] += 0.5;
      if (y < rows - 1) counts[(y + 1) * cols + x] += 0.5;
    }

    if (blur > 0) {
      const r = blur | 0;
      const tmp = new Float32Array(cols * rows);
      const out = new Float32Array(cols * rows);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let acc = 0, n = 0;
          for (let k = -r; k <= r; k++) {
            const nx = x + k;
            if (nx >= 0 && nx < cols) { acc += counts[y * cols + nx]; n++; }
          }
          tmp[y * cols + x] = acc / (n || 1);
        }
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let acc = 0, n = 0;
          for (let k = -r; k <= r; k++) {
            const ny = y + k;
            if (ny >= 0 && ny < rows) { acc += tmp[ny * cols + x]; n++; }
          }
          out[y * cols + x] = acc / (n || 1);
        }
      }
      return { cols, rows, counts: out };
    }

    return { cols, rows, counts };
  }, [data, windowMs, cols, rows, blur]);

  const palette = useMemo(
    () =>
      makeGradientPalette([
        { t: 0.0,  r:   0, g:   0, b: 255 },
        { t: 0.25, r:   0, g: 255, b: 255 },
        { t: 0.5,  r: 255, g: 255, b:   0 },
        { t: 0.75, r: 255, g: 128, b:   0 },
        { t: 1.0,  r: 255, g:   0, b:   0 },
      ]),
    []
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, { width: W, height: H }: { width: number; height: number }) => {
      ctx.clearRect(0, 0, W, H);

      const { cols: C, rows: R, counts } = grid;
      if (!C || !R || counts.length === 0) {
        drawFrame(ctx, W, H);
        return;
      }

      let maxV = 0;
      for (let i = 0; i < counts.length; i++) if (counts[i] > maxV) maxV = counts[i];
      const norm = maxV || 1;

      const img = ctx.createImageData(C, R);
      const buf = img.data;
      for (let y = 0; y < R; y++) {
        for (let x = 0; x < C; x++) {
          const v = counts[y * C + x];
          let t = v / norm;
          if (normalize === "sqrt") t = Math.sqrt(t);
          else if (normalize === "log") t = Math.log1p(t * 9) / Math.log1p(9);

          const { r, g, b } = palette(t);
          const yy = (R - 1 - y);
          const idx = (yy * C + x) * 4;
          buf[idx + 0] = r;
          buf[idx + 1] = g;
          buf[idx + 2] = b;
          buf[idx + 3] = v > 0 ? 255 : 0;
        }
      }

      const tmp = document.createElement("canvas");
      tmp.width = C;
      tmp.height = R;
      const tctx = tmp.getContext("2d")!;
      tctx.putImageData(img, 0, 0);

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tmp, 0, 0, W, H);

      drawFrame(ctx, W, H);
    },
    [grid, normalize, palette]
  );

  const { canvasRef } = useChartRenderer(draw, [grid, normalize, palette], { animate: false });

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
