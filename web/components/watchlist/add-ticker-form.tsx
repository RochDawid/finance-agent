"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddTickerFormProps {
  onAdd: (ticker: string, type: "stocks" | "crypto") => void;
}

export function AddTickerForm({ onAdd }: AddTickerFormProps) {
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<"stocks" | "crypto">("stocks");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = ticker.trim();
    if (!trimmed) return;
    const normalized = type === "crypto" ? trimmed.toLowerCase() : trimmed.toUpperCase();
    onAdd(normalized, type);
    setTicker("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        placeholder="Add ticker..."
        className="h-8 w-32 text-sm font-mono"
        aria-label="Ticker symbol"
      />
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={type === "stocks" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setType("stocks")}
        >
          Stock
        </Button>
        <Button
          type="button"
          variant={type === "crypto" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setType("crypto")}
        >
          Crypto
        </Button>
      </div>
      <Button type="submit" size="sm" className="h-8" aria-label="Add ticker">
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
