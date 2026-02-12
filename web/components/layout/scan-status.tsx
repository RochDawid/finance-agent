"use client";

import { cn } from "@/lib/utils";

interface ScanStatusProps {
  isScanning: boolean;
  lastScanTime: string | null;
  scanStage?: string | null;
  scanMessage?: string | null;
  className?: string;
}

export function ScanStatus({ isScanning, lastScanTime, scanStage, scanMessage, className }: ScanStatusProps) {
  if (isScanning) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4",
          className,
        )}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer opacity-40 pointer-events-none" />

        <div className="relative flex items-center gap-4">
          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-[var(--foreground)] animate-progress-pulse"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-[var(--foreground)] animate-progress-pulse"
              style={{ animationDelay: "200ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-[var(--foreground)] animate-progress-pulse"
              style={{ animationDelay: "400ms" }}
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {scanStage ?? "Scanning"}
            </span>
            {scanMessage && (
              <span className="text-xs font-mono text-[var(--muted-foreground)]">
                {scanMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!lastScanTime) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)]",
          className,
        )}
      >
        No scan yet — press <kbd className="mx-1 rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">Cmd+S</kbd> to run a scan.
      </div>
    );
  }

  const time = new Date(lastScanTime);
  const formatted = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-[var(--muted-foreground)]",
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-[var(--color-bullish)]" />
      <span>Last scan</span>
      <span className="font-mono">{formatted}</span>
    </div>
  );
}
