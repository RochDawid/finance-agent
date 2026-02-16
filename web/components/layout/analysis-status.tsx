"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap } from "lucide-react";

interface AnalysisStatusProps {
  isAnalyzing: boolean;
  lastAnalysisTime: string | null;
  analysisStage?: string | null;
  analysisMessage?: string | null;
  onAnalyze?: () => void;
  className?: string;
}

export function AnalysisStatus({
  isAnalyzing,
  lastAnalysisTime,
  analysisStage,
  analysisMessage,
  onAnalyze,
  className,
}: AnalysisStatusProps) {
  if (isAnalyzing) {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5 p-4",
        className,
      )}>
        {/* Shimmer sweep */}
        <div className="absolute inset-0 animate-shimmer opacity-30 pointer-events-none" />

        <div className="relative flex items-center gap-4">
          {/* Pulsing dots */}
          <div className="flex items-center gap-1">
            {[0, 200, 400].map((delay) => (
              <span
                key={delay}
                className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-progress-pulse"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold text-[var(--color-brand)]">
              {analysisStage ?? "Analyzing market…"}
            </span>
            {analysisMessage && analysisMessage !== analysisStage && (
              <span className="text-xs text-[var(--muted-foreground)] truncate">
                {analysisMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!lastAnalysisTime) return null;

  const time = new Date(lastAnalysisTime);
  const formatted = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-bullish)]" />
        <span>Last analysis</span>
        <span className="font-mono text-[var(--foreground)]">{formatted}</span>
      </div>
      {onAnalyze && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAnalyze}
          className="gap-1.5 h-7 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <RefreshCw className="h-3 w-3" />
          Run again
        </Button>
      )}
    </div>
  );
}
