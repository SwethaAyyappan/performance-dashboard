export type DataPoint = {
  timestamp: number;
  value: number;
};

export function generatePoint(): DataPoint {
  return {
    timestamp: Date.now(),
    value: Math.random() * 100, 
  };
}
