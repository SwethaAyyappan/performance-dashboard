// lib/canvasUtils.ts

/** Clamp a number into [min, max]. */
export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map v from [inMin, inMax] into [outMin, outMax]. */
export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  if (inMax === inMin) return outMin;
  const t = (v - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, t);
}

/** Returns current devicePixelRatio (≥1). */
export const getDpr = () => Math.max(1, window.devicePixelRatio || 1);

/**
 * Ensure a canvas is sized crisply for HiDPI displays.
 * Sets backing store size and applies a scale transform.
 * Returns the CSS pixel size actually used after sizing.
 */
export function ensureHiDPI(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = getDpr();
  const w = Math.max(0, canvas.clientWidth || 0);
  const h = Math.max(0, canvas.clientHeight || 0);
  const bw = Math.floor(w * dpr);
  const bh = Math.floor(h * dpr);

  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return { width: w, height: h, dpr };
}

/**
 * Align an X or Y coordinate to device pixels so 1px strokes look crisp.
 * Use this for stroke positions (e.g., borders, thin lines).
 */
export function pixelAlign(n: number, dpr = getDpr()) {
  // When scaled, half-pixel offsets land on device pixel boundaries.
  return Math.round(n * dpr) / dpr + (1 / (2 * dpr));
}

/** Draw a subtle frame around the chart area. */
export function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  const x = pixelAlign(0);
  const y = pixelAlign(0);
  const wAligned = Math.max(0, w - 1);
  const hAligned = Math.max(0, h - 1);
  ctx.strokeRect(x, y, wAligned, hAligned);
}

/**
 * Create a palette function from color stops.
 * Stops are in [0..1]. Returns {r,g,b} for input t in [0..1].
 */
export type RGB = { r: number; g: number; b: number };
export function makeGradientPalette(
  stops: Array<{ t: number; r: number; g: number; b: number }>
) {
  // Ensure sorted
  const s = stops.slice().sort((a, b) => a.t - b.t);
  return (t: number): RGB => {
    if (t <= s[0].t) return { r: s[0].r, g: s[0].g, b: s[0].b };
    if (t >= s[s.length - 1].t) {
      const e = s[s.length - 1];
      return { r: e.r, g: e.g, b: e.b };
    }
    let i = 0;
    while (i < s.length - 1 && t > s[i + 1].t) i++;
    const a = s[i], b = s[i + 1];
    const u = (t - a.t) / Math.max(1e-9, b.t - a.t);
    return {
      r: Math.round(lerp(a.r, b.r, u)),
      g: Math.round(lerp(a.g, b.g, u)),
      b: Math.round(lerp(a.b, b.b, u)),
    };
  };
}

/** Optional: lightweight grid lines (call before drawing data). */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: { x?: number; y?: number } = {}
) {
  const stepX = Math.max(40, opts.x ?? 80);
  const stepY = Math.max(24, opts.y ?? 40);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= w; x += stepX) {
    const xx = pixelAlign(x);
    ctx.beginPath();
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += stepY) {
    const yy = pixelAlign(y);
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(w, yy);
    ctx.stroke();
  }
  ctx.restore();
}
