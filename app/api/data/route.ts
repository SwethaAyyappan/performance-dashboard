import { NextResponse } from "next/server";

export async function GET() {
  
  const now = Date.now();
  return NextResponse.json([
    { timestamp: now - 3000, value: Math.random() * 100 },
    { timestamp: now - 2000, value: Math.random() * 100 },
    { timestamp: now - 1000, value: Math.random() * 100 },
    { timestamp: now,        value: Math.random() * 100 },
  ]);
}
