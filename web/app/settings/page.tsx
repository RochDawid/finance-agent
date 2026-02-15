"use client";

import { useState, useEffect } from "react";
import { useConfig } from "@/lib/providers/config-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, Check } from "lucide-react";
import type { AppConfig, ModelProvider } from "@finance/types/index.js";

const PROVIDERS: { value: ModelProvider; label: string; models: string[] }[] = [
  {
    value: "anthropic",
    label: "Anthropic",
    models: ["claude-opus-4-6", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
  },
  {
    value: "openai",
    label: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
  },
  {
    value: "google",
    label: "Google",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
];

function storageKeyFor(provider: string) {
  return `${provider}_api_key`;
}

export default function SettingsPage() {
  const { config, isLoading, updateConfig } = useConfig();
  const [activeTab, setActiveTab] = useState("model");
  const [draft, setDraft] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // Per-provider API key state
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    anthropic: "",
    openai: "",
    google: "",
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savedProvider, setSavedProvider] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => {
    if (config && !draft) {
      setDraft(config);
    }
  }, [config, draft]);

  useEffect(() => {
    setApiKeys({
      anthropic: localStorage.getItem(storageKeyFor("anthropic")) ?? "",
      openai: localStorage.getItem(storageKeyFor("openai")) ?? "",
      google: localStorage.getItem(storageKeyFor("google")) ?? "",
    });
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

  const handleSaveKey = (provider: string) => {
    const key = apiKeys[provider]?.trim() ?? "";
    if (key) {
      localStorage.setItem(storageKeyFor(provider), key);
    } else {
      localStorage.removeItem(storageKeyFor(provider));
    }
    window.dispatchEvent(new Event("storage"));
    setSavedProvider(provider);
    setTimeout(() => setSavedProvider(null), 2000);
  };

  const currentProvider = draft.model?.provider ?? "anthropic";
  const currentModels =
    PROVIDERS.find((p) => p.value === currentProvider)?.models ?? [];

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
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        {/* ── Model Tab ── */}
        <TabsContent value="model">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Provider</CardTitle>
                <CardDescription className="text-xs">
                  Choose which AI provider powers the analysis. Save Changes to apply.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          model: {
                            provider: p.value,
                            name: p.models[0] ?? draft.model?.name ?? "",
                          },
                        })
                      }
                      className={`relative flex flex-col items-center justify-center gap-1 rounded-lg border p-4 text-sm font-medium transition-colors cursor-pointer
                        ${
                          currentProvider === p.value
                            ? "border-[var(--foreground)] bg-[var(--foreground)]/8 text-[var(--foreground)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]/40 hover:text-[var(--foreground)]"
                        }`}
                    >
                      {currentProvider === p.value && (
                        <Check className="absolute top-2 right-2 h-3.5 w-3.5" />
                      )}
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-sm text-[var(--muted-foreground)] block mb-1.5">
                    Model
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {currentModels.map((m) => (
                      <label
                        key={m}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="model"
                          value={m}
                          checked={draft.model?.name === m}
                          onChange={() =>
                            setDraft({ ...draft, model: { ...draft.model, provider: currentProvider, name: m } })
                          }
                          className="accent-[var(--foreground)]"
                        />
                        <span className="font-mono text-sm group-hover:text-[var(--foreground)] text-[var(--muted-foreground)] transition-colors">
                          {m}
                        </span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2.5 cursor-pointer group mt-1">
                      <input
                        type="radio"
                        name="model"
                        value="custom"
                        checked={!currentModels.includes(draft.model?.name ?? "")}
                        onChange={() => {}}
                        className="accent-[var(--foreground)]"
                      />
                      <Input
                        value={
                          currentModels.includes(draft.model?.name ?? "")
                            ? ""
                            : (draft.model?.name ?? "")
                        }
                        onChange={(e) =>
                          setDraft({ ...draft, model: { provider: currentProvider, name: e.target.value } })
                        }
                        onFocus={() =>
                          setDraft({
                            ...draft,
                            model: {
                              provider: currentProvider,
                              name: currentModels.includes(draft.model?.name ?? "")
                                ? ""
                                : (draft.model?.name ?? ""),
                            },
                          })
                        }
                        placeholder="Custom model name..."
                        className="h-7 font-mono text-sm w-64"
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Risk Tab ── */}
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

        {/* ── API Keys Tab ── */}
        <TabsContent value="api">
          <div className="space-y-4">
            {/* Per-provider keys — stored in browser only */}
            {PROVIDERS.map((p) => (
              <Card key={p.value}>
                <CardHeader>
                  <CardTitle className="text-sm">{p.label} API Key</CardTitle>
                  <CardDescription className="text-xs">
                    Stored only in your browser — never sent to our servers.
                    {currentProvider === p.value && (
                      <span className="ml-1 text-[var(--foreground)] font-medium">
                        (currently active provider)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys[p.value] ? "text" : "password"}
                        value={apiKeys[p.value] ?? ""}
                        onChange={(e) =>
                          setApiKeys((prev) => ({ ...prev, [p.value]: e.target.value }))
                        }
                        placeholder={
                          p.value === "anthropic"
                            ? "sk-ant-..."
                            : p.value === "openai"
                              ? "sk-..."
                              : "AI..."
                        }
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeys((prev) => ({ ...prev, [p.value]: !prev[p.value] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        aria-label={showKeys[p.value] ? "Hide key" : "Show key"}
                      >
                        {showKeys[p.value] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey(p.value)}>
                      {savedProvider === p.value ? "Saved!" : "Save"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Other data API keys — saved to server config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data API Keys</CardTitle>
                <CardDescription className="text-xs">
                  Optional keys for enhanced market data.
                </CardDescription>
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
                        apiKeys: { ...draft.apiKeys, alphaVantage: e.target.value || undefined },
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
                        apiKeys: { ...draft.apiKeys, coinGecko: e.target.value || undefined },
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
