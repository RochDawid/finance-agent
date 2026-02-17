"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, Check } from "lucide-react";

interface TickerFilterProps {
  tickers: string[];
  selected: string[];
  onChange: (tickers: string[]) => void;
}

export function TickerFilter({ tickers, selected, onChange }: TickerFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (ticker: string) => {
    if (selected.includes(ticker)) {
      onChange(selected.filter((t) => t !== ticker));
    } else {
      onChange([...selected, ticker]);
    }
  };

  const allSelected = selected.length === tickers.length;
  const noneSelected = selected.length === 0;
  const isFiltered = !allSelected;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "gap-1.5 h-7 text-xs shrink-0",
          isFiltered
            ? "text-[var(--color-brand)] hover:text-[var(--color-brand)]"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        )}
      >
        <SlidersHorizontal className="h-3 w-3" />
        {isFiltered ? `${selected.length} of ${tickers.length}` : "Filter"}
      </Button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 z-50 mt-1 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg",
            "animate-fade-in",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Tickers to analyze</span>
            <div className="flex gap-2">
              <button
                onClick={() => onChange(tickers)}
                disabled={allSelected}
                className="text-[10px] text-[var(--color-brand)] hover:underline disabled:opacity-40 disabled:no-underline"
              >
                All
              </button>
              <button
                onClick={() => onChange([])}
                disabled={noneSelected}
                className="text-[10px] text-[var(--muted-foreground)] hover:underline disabled:opacity-40 disabled:no-underline"
              >
                None
              </button>
            </div>
          </div>

          {/* Ticker list */}
          <div className="p-1.5 max-h-64 overflow-y-auto">
            {tickers.map((ticker) => {
              const isSelected = selected.includes(ticker);
              return (
                <button
                  key={ticker}
                  role="menuitem"
                  onClick={() => toggle(ticker)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                    isSelected
                      ? "bg-[var(--color-brand)]/8 text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  <span className="font-mono font-semibold">{ticker}</span>
                  {isSelected && <Check className="h-3 w-3 text-[var(--color-brand)] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
