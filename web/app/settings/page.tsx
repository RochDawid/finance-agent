"use client";

import { useState, useEffect } from "react";
import { useConfig } from "@/lib/providers/config-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff } from "lucide-react";
import type { AppConfig } from "@finance/types/index.js";

export default function SettingsPage() {
  const { config, isLoading, updateConfig } = useConfig();
  const [activeTab, setActiveTab] = useState("risk");
  const [draft, setDraft] = useState<AppConfig | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, []);
  const [saving, setSaving] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [anthropicKeySaved, setAnthropicKeySaved] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  useEffect(() => {
    if (config && !draft) {
      setDraft(config);
    }
  }, [config, draft]);

  useEffect(() => {
    setAnthropicKey(localStorage.getItem("anthropic_api_key") ?? "");
  }, []);

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

  const handleSaveAnthropicKey = () => {
    if (anthropicKey.trim()) {
      localStorage.setItem("anthropic_api_key", anthropicKey.trim());
    } else {
      localStorage.removeItem("anthropic_api_key");
    }
    // Notify other tabs/components
    window.dispatchEvent(new Event("storage"));
    setAnthropicKeySaved(true);
    setTimeout(() => setAnthropicKeySaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Settings</h1>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="scan">Analysis</TabsTrigger>
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
              <CardTitle className="text-sm">Analysis Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                label="Analysis Interval (seconds)"
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
          <div className="space-y-4">
            {/* Anthropic API Key — stored in browser only */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Anthropic API Key</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Required to run AI analysis. Stored only in your browser — never sent to our servers.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showAnthropicKey ? "text" : "password"}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropicKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      aria-label={showAnthropicKey ? "Hide key" : "Show key"}
                    >
                      {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button size="sm" onClick={handleSaveAnthropicKey}>
                    {anthropicKeySaved ? "Saved!" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Other API keys — saved to server config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Other API Keys</CardTitle>
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
          </div>
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
