"use client";

import { useEffect, useRef } from "react";

interface Shortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
        if (!e.metaKey && !e.ctrlKey) return;
      }

      for (const shortcut of shortcutsRef.current) {
        const metaMatch = shortcut.meta ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : true;

        if (e.key === shortcut.key && metaMatch && shiftMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // runs once; always reads latest shortcuts via ref
}

export type { Shortcut };
