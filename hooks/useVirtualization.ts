// hooks/useVirtualization.ts
import { useMemo } from "react";

export type VirtualRange = {
  start: number;     // first row index to render (inclusive)
  end: number;       // last row index to render (exclusive)
  offset: number;    // px to translate the rendered block from the top
  totalHeight: number; // full scrollable height
};

/**
 * Compute a virtual range for fixed-height rows.
 */
export function useVirtualization(opts: {
  total: number;
  rowHeight: number;       // px per row
  viewportHeight: number;  // px
  scrollTop: number;       // px
  overscan?: number;       // extra rows above/below for smoother scroll
}): VirtualRange {
  const { total, rowHeight, viewportHeight, scrollTop, overscan = 6 } = opts;

  return useMemo(() => {
    if (total <= 0 || rowHeight <= 0 || viewportHeight <= 0) {
      return { start: 0, end: 0, offset: 0, totalHeight: total * rowHeight };
    }

    const firstVisible = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(viewportHeight / rowHeight);

    const start = Math.max(0, firstVisible - overscan);
    const end = Math.min(total, firstVisible + visibleCount + overscan);
    const offset = start * rowHeight;

    return {
      start,
      end,
      offset,
      totalHeight: total * rowHeight,
    };
  }, [total, rowHeight, viewportHeight, scrollTop, overscan]);
}
