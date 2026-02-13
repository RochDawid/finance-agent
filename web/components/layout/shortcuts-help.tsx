"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ["Cmd", "K"], description: "Command palette" },
  { keys: ["Cmd", "S"], description: "Trigger scan" },
  { keys: ["Cmd", "D"], description: "Go to dashboard" },
  { keys: ["Escape"], description: "Close dialog" },
  { keys: ["?"], description: "This help" },
  { keys: ["t"], description: "Toggle theme" },
  { keys: ["1–9"], description: "Open signal by index" },
];

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">{description}</span>
              <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-1.5 py-0.5 text-xs font-mono bg-[var(--muted)] rounded border border-[var(--border)]"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
