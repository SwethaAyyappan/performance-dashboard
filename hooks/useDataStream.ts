"use client";

import { useEffect, useRef, useState } from "react";
import { generatePoint, DataPoint } from "../lib/dataGenerator";

export function useDataStream(updateInterval = 100) {
  const [data, setData] = useState<DataPoint[]>([]);
  const dataRef = useRef<DataPoint[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPoint = generatePoint();

     
      
    
      dataRef.current = [...dataRef.current, newPoint].slice(-40000);

      setData([...dataRef.current]);


      
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return data;
}
