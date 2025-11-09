"use client";

import { useEffect, useState } from "react";

export function usePerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<number | null>(null);

  useEffect(() => {
    let last = performance.now();
    let frames = 0;

    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;

        if ((performance as any).memory) {
          const mem = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
          setMemory(mem);
        }
      }
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }, []);

  return { fps, memory };
}
