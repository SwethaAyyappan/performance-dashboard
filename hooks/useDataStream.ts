"use client";

import { useEffect, useRef, useState } from "react";
import { generatePoint, DataPoint } from "../lib/dataGenerator";

// Public rates so UI can reference them
export const STREAM_RATE = {
  fast: 100,
  medium: 300,
  slow: 1000,
};

export function useDataStream(defaultInterval = STREAM_RATE.fast) {
  const [data, setData] = useState<DataPoint[]>([]);
  const dataRef = useRef<DataPoint[]>([]);
  const [intervalMs, setIntervalMs] = useState(defaultInterval);

  // Listen for global rate change events (dispatched by dashboard UI)
  useEffect(() => {
    const handler = (e: any) => {
      setIntervalMs(e.detail);
    };
    window.addEventListener("rateChange", handler);
    return () => window.removeEventListener("rateChange", handler);
  }, []);

  // Streaming loop
  useEffect(() => {
    const id = setInterval(() => {
      const newPoint = generatePoint();

      // Keep a max buffer size (~40k points)
      dataRef.current = [...dataRef.current, newPoint].slice(-40000);

      // Emit a new array (so React sees a change)
      setData([...dataRef.current]);
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return data;
}
