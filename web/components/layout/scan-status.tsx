"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";

interface ScanStatusProps {
  isScanning: boolean;
  lastScanTime: string | null;
  scanStage?: string | null;
  scanMessage?: string | null;
  onScan?: () => void;
  className?: string;
}

export function ScanStatus({ isScanning, lastScanTime, scanStage, scanMessage, onScan, className }: ScanStatusProps) {
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
              {scanStage ?? "Analyzing"}
            </span>
            {scanMessage && scanMessage !== scanStage && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {scanMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!lastScanTime) {
    return null;
  }

  const time = new Date(lastScanTime);
  const formatted = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <span className="h-2 w-2 rounded-full bg-[var(--color-bullish)]" />
        <span>Last analysis</span>
        <span className="font-mono">{formatted}</span>
      </div>
      {onScan && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onScan}
          className="gap-1.5 h-7 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Analyze again
        </Button>
      )}
    </div>
  );
}
