import { NextResponse } from "next/server";
import { getScanCache, isScanning } from "@/lib/scan-cache";
import { performScan } from "@/lib/scan-loop";

export async function GET() {
  const cache = getScanCache();
  return NextResponse.json({
    ...cache,
    isScanning: isScanning(),
  });
}

export async function POST() {
  if (isScanning()) {
    return NextResponse.json({ error: "Scan already in progress" }, { status: 409 });
  }

  // Fire and forget — results come via WebSocket
  performScan();

  return NextResponse.json({ status: "started" });
}
