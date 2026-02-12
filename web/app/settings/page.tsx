"use client";

import { useState, useEffect } from "react";
import { useConfig } from "@/lib/providers/config-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppConfig } from "@finance/types/index.js";

export default function SettingsPage() {
  const { config, isLoading, updateConfig } = useConfig();
  const [draft, setDraft] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config && !draft) {
      setDraft(config);
    }
  }, [config, draft]);

  if (isLoading || !draft) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Settings</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await updateConfig(draft);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Settings</h1>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="risk">
        <TabsList>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Risk Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                label="Max Risk Per Trade (%)"
                value={draft.risk.maxRiskPerTrade}
                onChange={(v) =>
                  setDraft({ ...draft, risk: { ...draft.risk, maxRiskPerTrade: v } })
                }
                type="number"
                step={0.5}
              />
              <SettingField
                label="Min Risk:Reward Ratio"
                value={draft.risk.minRiskReward}
                onChange={(v) =>
                  setDraft({ ...draft, risk: { ...draft.risk, minRiskReward: v } })
                }
                type="number"
                step={0.5}
              />
              <SettingField
                label="Portfolio Size ($)"
                value={draft.risk.portfolioSize}
                onChange={(v) =>
                  setDraft({ ...draft, risk: { ...draft.risk, portfolioSize: v } })
                }
                type="number"
                step={1000}
              />
              <SettingField
                label="Max Open Positions"
                value={draft.risk.maxOpenPositions ?? 0}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    risk: { ...draft.risk, maxOpenPositions: v || undefined },
                  })
                }
                type="number"
                step={1}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scan Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                label="Scan Interval (seconds)"
                value={draft.intervals.scan}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    intervals: { ...draft.intervals, scan: v },
                  })
                }
                type="number"
                step={30}
              />
              <SettingField
                label="Data Refresh (seconds)"
                value={draft.intervals.dataRefresh}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    intervals: { ...draft.intervals, dataRefresh: v },
                  })
                }
                type="number"
                step={5}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-[var(--muted-foreground)] block mb-1">
                  Alpha Vantage API Key
                </label>
                <Input
                  type="password"
                  value={draft.apiKeys.alphaVantage ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      apiKeys: {
                        ...draft.apiKeys,
                        alphaVantage: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="Enter API key..."
                />
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)] block mb-1">
                  CoinGecko API Key
                </label>
                <Input
                  type="password"
                  value={draft.apiKeys.coinGecko ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      apiKeys: {
                        ...draft.apiKeys,
                        coinGecko: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="Enter API key..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingField({
  label,
  value,
  onChange,
  type = "number",
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  type?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="text-sm text-[var(--muted-foreground)] block mb-1">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        className="w-48 font-mono"
      />
    </div>
  );
}
