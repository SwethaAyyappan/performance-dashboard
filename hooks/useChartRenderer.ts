// hooks/useChartRenderer.ts
import { useEffect, useRef, useState, useCallback } from "react";

export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  now: number
) => void;

type Options = {
  /** If true, run a rAF loop and call draw every frame */
  animate?: boolean;
  /** When animate=false, you can call redraw() manually after data changes */
};

/**
 * Shared canvas lifecycle for charts:
 * - HiDPI aware sizing (devicePixelRatio)
 * - ResizeObserver to keep canvas crisp
 * - Optional rAF loop
 * - Manual redraw for data-driven charts
 */
export function useChartRenderer(draw: DrawFn, deps: any[] = [], options: Options = {}) {
  const { animate = false } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const resizeAndDraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || 0;
    const h = canvas.clientHeight || 0;

    // Only update backing store if size actually changed
    const bw = Math.floor(w * dpr);
    const bh = Math.floor(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    setSize({ width: w, height: h });
    draw(ctx, { width: w, height: h }, performance.now());
  }, [draw]);

  // Manual redraw for data-driven updates (when animate=false)
  const redraw = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    draw(ctx, { width: canvas.clientWidth, height: canvas.clientHeight }, performance.now());
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    // Observe size changes
    const ro = new ResizeObserver(() => resizeAndDraw());
    ro.observe(canvas);
    roRef.current = ro;

    // Initial draw
    resizeAndDraw();

    // Optional animation loop
    if (animate) {
      const loop = () => {
        const c = canvasRef.current;
        const cx = ctxRef.current;
        if (!c || !cx) return;
        draw(cx, { width: c.clientWidth, height: c.clientHeight }, performance.now());
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      roRef.current?.disconnect();
      roRef.current = null;
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, resizeAndDraw, ...deps]);

  return { canvasRef, redraw, size };
}
