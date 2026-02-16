"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RegimeBadge } from "@/components/data/regime-badge";
import { SignalList } from "@/components/signals/signal-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Clock, Activity } from "lucide-react";
import { cn, formatPercent } from "@/lib/utils";
import type { AnalysisHistoryEntry, SignalWithId } from "@/lib/types";
import type { Signal } from "@finance/types/index.js";

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return isToday
    ? `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function addIds(signals: Signal[]): SignalWithId[] {
  return signals.map((s, i) => ({ ...s, id: `hist-${s.ticker}-${s.direction}-${i}` }));
}

function HistoryEntry({ entry, index }: { entry: AnalysisHistoryEntry; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const mc = entry.marketCondition;

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          className="flex items-start justify-between gap-3 w-full text-left rounded-lg p-1 -m-1 cursor-pointer hover:bg-[var(--accent)] transition-colors"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
              <span className="text-sm font-medium">{formatTimestamp(entry.timestamp)}</span>
              {mc && <RegimeBadge regime={mc.regime} />}
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] flex-wrap">
              {mc && (
                <>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      mc.sp500Change >= 0 ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]",
                    )}
                  >
                    S&P {formatPercent(mc.sp500Change)}
                  </span>
                  <span className="text-[var(--border)]">·</span>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      mc.nasdaqChange >= 0 ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]",
                    )}
                  >
                    NASDAQ {formatPercent(mc.nasdaqChange)}
                  </span>
                  <span className="text-[var(--border)]">·</span>
                </>
              )}
              <span>
                <span className="font-medium text-[var(--foreground)]">{entry.signals.length}</span>{" "}
                signal{entry.signals.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[var(--border)]">·</span>
              <span>${entry.costUsd.toFixed(4)}</span>
            </div>
          </div>

          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)] shrink-0 mt-0.5" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)] shrink-0 mt-0.5" />
          )}
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {entry.marketOverview && (
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap border-t border-[var(--border)] pt-4">
              {entry.marketOverview}
            </p>
          )}
          {entry.signals.length > 0 ? (
            <SignalList signals={addIds(entry.signals)} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Activity className="h-6 w-6 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">No signals found in this run</p>
            </div>
          )}
          {entry.errors.length > 0 && (
            <div className="text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] pt-3 space-y-1">
              {entry.errors.map((e) => (
                <div key={e.ticker}>
                  <span className="font-mono">{e.ticker}</span>: {e.error}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistoryEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/analyze")
      .then((r) => r.json())
      .then((data: { history?: AnalysisHistoryEntry[] }) => {
        setHistory(data.history ?? []);
      })
      .catch(() => setHistory([]));
  }, []);

  if (history === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">History</h1>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">History</h1>
        <span className="text-xs text-[var(--muted-foreground)]">Last {history.length} of 3 analyses</span>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)]">
            <Clock className="h-8 w-8 text-[var(--muted-foreground)]" />
          </div>
          <div>
            <p className="font-medium mb-1">No analyses yet</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Run your first analysis from the dashboard to see results here.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="/">Go to Dashboard</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, i) => (
            <HistoryEntry key={entry.timestamp} entry={entry} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
