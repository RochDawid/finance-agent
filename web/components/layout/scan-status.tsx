"use client";

import { cn } from "@/lib/utils";

interface ScanStatusProps {
  isScanning: boolean;
  lastScanTime: string | null;
  className?: string;
}

export function ScanStatus({ isScanning, lastScanTime, className }: ScanStatusProps) {
  if (isScanning) {
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-neutral)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-neutral)]" />
        </span>
        <span className="text-[var(--muted-foreground)]">Scanning...</span>
      </div>
    );
  }

  if (!lastScanTime) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-[var(--muted-foreground)]", className)}>
        <span className="h-2 w-2 rounded-full bg-[var(--muted)]" />
        No scan yet
      </div>
    );
  }

  const time = new Date(lastScanTime);
  const formatted = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={cn("flex items-center gap-2 text-xs text-[var(--muted-foreground)]", className)}>
      <span className="h-2 w-2 rounded-full bg-[var(--color-bullish)]" />
      Last scan: {formatted}
    </div>
  );
}
