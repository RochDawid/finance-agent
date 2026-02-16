"use client";

import { useState, type FormEvent } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/providers/toast-provider";
import { cn } from "@/lib/utils";

interface AddTickerDialogProps {
  onAdd: (ticker: string, type: "stocks" | "crypto") => Promise<void>;
  existingTickers: string[];
}

// 1–5 uppercase letters, optionally followed by a dot + 1–2 letters (e.g. BRK.B)
const STOCK_REGEX = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;
// Lowercase letters, numbers, hyphens — CoinGecko IDs (e.g. bitcoin, usd-coin)
const CRYPTO_REGEX = /^[a-z][a-z0-9-]{0,49}$/;

export function AddTickerDialog({ onAdd, existingTickers }: AddTickerDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<"stocks" | "crypto">("stocks");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTicker("");
      setType("stocks");
      setError(null);
    }
    setOpen(next);
  };

  const handleTickerChange = (val: string) => {
    const transformed = type === "stocks" ? val.toUpperCase() : val.toLowerCase();
    setTicker(transformed);
    if (error) setError(null);
  };

  const handleTypeChange = (next: "stocks" | "crypto") => {
    setType(next);
    setTicker((prev) => (next === "stocks" ? prev.toUpperCase() : prev.toLowerCase()));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = ticker.trim();
    if (!trimmed) return;

    const regex = type === "crypto" ? CRYPTO_REGEX : STOCK_REGEX;
    if (!regex.test(trimmed)) {
      setError(
        type === "crypto"
          ? "Use the CoinGecko ID format (e.g. bitcoin, usd-coin)"
          : "Use 1–5 uppercase letters (e.g. AAPL, BRK.B)",
      );
      return;
    }

    if (existingTickers.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError(`${trimmed.toUpperCase()} is already in your watchlist`);
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      const apiType = type === "crypto" ? "crypto" : "stock";
      const res = await fetch(`/api/ticker/${trimmed}/quote?type=${apiType}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Ticker not found");
      }
      await onAdd(trimmed, type);
      handleOpenChange(false);
      toast(`${trimmed} added to watchlist`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify ticker");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Ticker
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Input
              value={ticker}
              onChange={(e) => handleTickerChange(e.target.value)}
              placeholder={type === "crypto" ? "e.g. bitcoin" : "e.g. AAPL"}
              className={cn(
                "font-mono",
                error && "border-red-500 focus-visible:ring-red-500",
              )}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              disabled={isValidating}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted-foreground)] shrink-0">Type</span>
            <div className="flex rounded-lg border border-[var(--border)] p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => handleTypeChange("stocks")}
                disabled={isValidating}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                  type === "stocks"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                )}
              >
                Stock / ETF
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("crypto")}
                disabled={isValidating}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                  type === "crypto"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                )}
              >
                Crypto
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={isValidating || !ticker.trim()}>
              {isValidating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
