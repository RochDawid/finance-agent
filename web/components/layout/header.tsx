"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Scan, Command, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWS } from "@/lib/providers/ws-provider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
}

export function Header({ onOpenCommandPalette, onOpenShortcuts }: HeaderProps) {
  const { state, connected, triggerScan } = useWS();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center gap-3">
        {!connected && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-bearish)]" />
            <span className="text-xs text-[var(--color-bearish)]">Disconnected</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={triggerScan}
              disabled={state.isScanning}
              aria-label="Trigger scan"
            >
              <Scan className={cn("h-4 w-4", state.isScanning && "animate-spin-slow")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Scan now (Cmd+S)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onOpenCommandPalette}
              aria-label="Command palette"
            >
              <Command className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Command palette (Cmd+K)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 hidden dark:block" />
              <Moon className="h-4 w-4 dark:hidden" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme (t)</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
