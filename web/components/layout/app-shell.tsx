"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandPalette } from "./command-palette";
import { ShortcutsHelp } from "./shortcuts-help";
import { MobileNav } from "./mobile-nav";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useWS } from "@/lib/providers/ws-provider";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { triggerAnalysis, state } = useWS();

  useKeyboardShortcuts([
    { key: "k", meta: true, handler: () => setCmdOpen(true), description: "Command palette" },
    { key: "a", meta: true, handler: () => triggerAnalysis(), description: "Run analysis" },
    { key: "d", handler: () => router.push("/"), description: "Dashboard" },
    { key: "w", handler: () => router.push("/watchlist"), description: "Watchlist" },
    { key: "h", handler: () => router.push("/history"), description: "History" },
    { key: ",", handler: () => router.push("/settings"), description: "Settings" },
    { key: "?", handler: () => setShortcutsOpen(true), description: "Shortcuts help" },
    { key: "t", handler: () => setTheme(theme === "dark" ? "light" : "dark"), description: "Toggle theme" },
    { key: "Escape", handler: () => { setCmdOpen(false); setShortcutsOpen(false); }, description: "Close" },
    ...Array.from({ length: 9 }, (_, i) => ({
      key: String(i + 1),
      handler: () => {
        const signal = state.signals[i];
        if (signal) router.push(`/signals/${signal.id}`);
      },
      description: `Select signal ${i + 1}`,
    })),
  ]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-[var(--background)]">
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header
            onOpenCommandPalette={() => setCmdOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />
          <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-8 pb-20 md:pb-8">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Accessible live region for analysis updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {state.isAnalyzing
          ? "Analysis in progress"
          : state.lastAnalysisTime
            ? `Analysis completed at ${new Date(state.lastAnalysisTime).toLocaleTimeString()}`
            : ""}
      </div>
    </TooltipProvider>
  );
}
