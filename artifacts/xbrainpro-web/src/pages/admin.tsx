import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Shield, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const API_BASE = `${import.meta.env.BASE_URL}api`;

interface ModelOption {
  id: string;
  label: string;
  tier: "free" | "paid";
  note: string;
}

interface AdminSettings {
  model: string;
  storedModel: string | null;
  envModel: string | null;
  defaultModel: string;
  options: ModelOption[];
}

interface AdminStats {
  users: number;
  programs: number;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    const err = new Error(body?.error || `Request failed (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customModel, setCustomModel] = useState("");

  const settingsQuery = useQuery<AdminSettings, Error & { status?: number }>({
    queryKey: ["admin-settings"],
    queryFn: () => fetchJson<AdminSettings>("/admin/settings"),
    retry: false,
  });

  const statsQuery = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => fetchJson<AdminStats>("/admin/stats"),
    retry: false,
    enabled: settingsQuery.isSuccess,
  });

  const saveModel = useMutation({
    mutationFn: (model: string) =>
      fetchJson<{ model: string }>("/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setCustomModel("");
      toast({
        title: "Model updated",
        description: `AI model is now ${data.model}`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to update",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (settingsQuery.isError) {
    const status = settingsQuery.error?.status;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2">
            {status === 403 ? "Admin access required" : "Please log in"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {status === 403
              ? "This account does not have admin access."
              : "Log in with an admin account to view this page."}
          </p>
        </div>
      </div>
    );
  }

  const settings = settingsQuery.data!;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-8"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-title">
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage the AI model used for plan generation and coaching
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Users
            </p>
            <p className="text-2xl font-bold" data-testid="text-stat-users">
              {statsQuery.data?.users ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Programs
            </p>
            <p className="text-2xl font-bold" data-testid="text-stat-programs">
              {statsQuery.data?.programs ?? "—"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="font-semibold mb-1">Current AI model</h2>
            <p
              className="text-sm font-mono text-primary"
              data-testid="text-current-model"
            >
              {settings.model}
            </p>
          </div>

          <div className="space-y-2">
            {settings.options.map((opt) => {
              const active = settings.model === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => !active && saveModel.mutate(opt.id)}
                  disabled={saveModel.isPending}
                  data-testid={`button-model-${opt.id.replace(/[^a-z0-9]/gi, "-")}`}
                  className={`w-full text-left rounded-lg border p-4 transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{opt.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${
                            opt.tier === "free"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-amber-500/15 text-amber-500"
                          }`}
                        >
                          {opt.tier}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {opt.note}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground mt-1">
                        {opt.id}
                      </p>
                    </div>
                    {active && <Check className="w-5 h-5 text-primary shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium mb-2">Custom model ID</p>
            <div className="flex gap-2">
              <Input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. google/gemini-2.5-flash"
                data-testid="input-custom-model"
              />
              <Button
                onClick={() => customModel.trim() && saveModel.mutate(customModel.trim())}
                disabled={!customModel.trim() || saveModel.isPending}
                data-testid="button-save-custom-model"
              >
                {saveModel.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Any model ID from openrouter.ai/models. Paid models need OpenRouter
              credits.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
