// lib/performanceUtils.ts
import type { DataPoint } from "./dataGenerator";

/**
 * Adaptive time aggregation:
 * - Uses given bucketMs as a minimum granularity.
 * - Ensures ~minBuckets buckets based on available duration, so we always have >=2 points.
 */
export function aggregateByTime(
  data: DataPoint[],
  bucketMs: number,
  windowMs: number,
  windowEnd?: number,
  minBuckets: number = 240 // target ~240 points on screen
): DataPoint[] {
  if (data.length === 0) return [];

  const end = windowEnd ?? (data[data.length - 1]?.timestamp || Date.now());
  const start = end - windowMs;

  // binary search to first index >= start
  let left = 0,
    right = data.length - 1,
    idx = data.length;
  while (left <= right) {
    const mid = (left + right) >> 1;
    if (data[mid].timestamp >= start) {
      idx = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  const slice = data.slice(Math.max(0, idx));
  if (slice.length === 0) return [];

  // Determine effective duration we actually have
  const firstTs = slice[0].timestamp;
  const lastTs = slice[slice.length - 1].timestamp;
  const availableDuration = Math.max(1, lastTs - firstTs);

  // Adapt bucket so we aim for ~minBuckets buckets, but never finer than bucketMs
  const targetBucket = Math.ceil(availableDuration / Math.max(2, minBuckets));
  const effBucket = Math.max(bucketMs, targetBucket);

  // Bucketize
  const buckets = new Map<number, { sum: number; count: number }>();
  for (let i = 0; i < slice.length; i++) {
    const p = slice[i];
    const b = Math.floor(p.timestamp / effBucket) * effBucket;
    const agg = buckets.get(b);
    if (agg) {
      agg.sum += p.value;
      agg.count += 1;
    } else {
      buckets.set(b, { sum: p.value, count: 1 });
    }
  }

  const result: DataPoint[] = [];
  const entries = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
  for (const [t, { sum, count }] of entries) {
    result.push({ timestamp: t, value: sum / count });
  }
  return result;
}
