"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Command, HelpCircle, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWS } from "@/lib/providers/ws-provider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
}

export function Header({ onOpenCommandPalette, onOpenShortcuts }: HeaderProps) {
  const { state, connected, hasApiKey, triggerAnalysis } = useWS();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between h-14 px-5 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm">
      {/* Left: connection indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors",
            connected ? "bg-[var(--color-bullish)]" : "bg-[var(--color-bearish)]",
          )} />
          <span className={cn(
            "text-xs transition-colors",
            connected ? "text-[var(--muted-foreground)]" : "text-[var(--color-bearish)]",
          )}>
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Analyze CTA — visible and prominent */}
        <Button
          variant="default"
          size="sm"
          onClick={triggerAnalysis}
          disabled={state.isAnalyzing}
          className={cn(
            "h-8 px-3 gap-1.5 text-xs font-semibold transition-all",
            "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white border-0",
            "disabled:opacity-40",
          )}
          aria-label="Run analysis"
        >
          {state.isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          {state.isAnalyzing ? "Analyzing…" : "Analyze"}
        </Button>

        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={onOpenCommandPalette}
              aria-label="Command palette"
            >
              <Command className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Command palette (⌘K)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={onOpenShortcuts}
              aria-label="Keyboard shortcuts"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Shortcuts (?)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 hidden dark:block" />
              <Moon className="h-4 w-4 dark:hidden" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme (T)</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
