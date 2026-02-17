"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  List,
  Settings,
  Activity,
  BarChart3,
} from "lucide-react";
import { useWS } from "@/lib/providers/ws-provider";
import { useConfig } from "@/lib/providers/config-provider";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { triggerAnalysis, state } = useWS();
  const { config } = useConfig();

  const navigate = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  const allTickers = [
    ...(config?.watchlist.stocks ?? []),
    ...(config?.watchlist.crypto ?? []),
  ];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-2xl overflow-hidden">
          <Command.Input
            placeholder="Search signals, tickers, pages..."
            className="w-full px-4 py-3 text-sm bg-transparent border-b border-[var(--border)] outline-none placeholder:text-[var(--muted-foreground)]"
          />
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--muted-foreground)]">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="text-xs text-[var(--muted-foreground)] px-2 py-1">
              <Command.Item
                onSelect={() => navigate("/")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer aria-selected:bg-[var(--accent)]"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/watchlist")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer aria-selected:bg-[var(--accent)]"
              >
                <List className="h-4 w-4" />
                Watchlist
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/settings")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer aria-selected:bg-[var(--accent)]"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions" className="text-xs text-[var(--muted-foreground)] px-2 py-1">
              <Command.Item
                onSelect={() => {
                  triggerAnalysis();
                  onOpenChange(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer aria-selected:bg-[var(--accent)]"
              >
                <Activity className="h-4 w-4" />
                Run Analysis
              </Command.Item>
            </Command.Group>

            {allTickers.length > 0 && (
              <Command.Group heading="Tickers" className="text-xs text-[var(--muted-foreground)] px-2 py-1">
                {allTickers.map((ticker) => (
                  <Command.Item
                    key={ticker}
                    value={ticker}
                    onSelect={() => navigate(`/details/${ticker}`)}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer aria-selected:bg-[var(--accent)] font-mono"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {ticker}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {state.signals.length > 0 && (
              <Command.Group heading="Signals" className="text-xs text-[var(--muted-foreground)] px-2 py-1">
                {state.signals.map((signal) => (
                  <Command.Item
                    key={signal.id}
                    value={`${signal.ticker} ${signal.direction}`}
                    onSelect={() => navigate(`/signals/${signal.id}`)}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer aria-selected:bg-[var(--accent)]"
                  >
                    <span className="font-mono">{signal.ticker}</span>
                    <span className={signal.direction === "long" ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]"}>
                      {signal.direction.toUpperCase()}
                    </span>
                    <span className="text-[var(--muted-foreground)] text-xs ml-auto">
                      {signal.confidenceScore}%
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </div>
      </div>
    </Command.Dialog>
  );
}
