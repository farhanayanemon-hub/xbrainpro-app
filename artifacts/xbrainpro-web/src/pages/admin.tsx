import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Shield,
  Save,
  Check,
  Plus,
  Pencil,
  Trash2,
  Users,
  Boxes,
  Map as MapIcon,
  LogOut,
  UploadCloud,
  Package,
  ImageIcon,
} from "lucide-react";
import { useLogout, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const API_BASE = `${import.meta.env.BASE_URL}api`;

const WORLD_KINDS = [
  "building",
  "tree",
  "lamp",
  "prop",
  "roofProp",
  "car",
  "fountain",
  "stall",
  "npc",
] as const;

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
  worldObjects: number;
  worldVersion: number;
}

interface WorldObject {
  id: number;
  kind: string;
  data: Record<string, unknown>;
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
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function objectSummary(data: Record<string, unknown>): string {
  const name = typeof data["name"] === "string" ? (data["name"] as string) : null;
  const pos = Array.isArray(data["position"])
    ? `(${(data["position"] as unknown[]).map((n) => String(n)).join(", ")})`
    : null;
  return [name, pos].filter(Boolean).join(" · ") || "—";
}

function StatCard({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  testId: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <p className="text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold mt-1" data-testid={testId}>
        {value}
      </p>
    </div>
  );
}

interface EditorState {
  id: number | null;
  kind: string;
  json: string;
}

function WorldObjectsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState<WorldObject | null>(null);

  const mapQuery = useQuery<{ version: number; objects: WorldObject[] }>({
    queryKey: ["world-map-admin"],
    queryFn: () => fetchJson("/world/map"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["world-map-admin"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const save = useMutation({
    mutationFn: async (state: EditorState) => {
      let data: unknown;
      try {
        data = JSON.parse(state.json);
      } catch {
        throw new Error("Data must be valid JSON");
      }
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Data must be a JSON object, e.g. { \"position\": [0, 0] }");
      }
      const body = JSON.stringify({ kind: state.kind, data });
      const init: RequestInit = {
        method: state.id === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      };
      return fetchJson<WorldObject & { version: number }>(
        state.id === null
          ? "/admin/world/objects"
          : `/admin/world/objects/${state.id}`,
        init,
      );
    },
    onSuccess: (res) => {
      invalidate();
      setEditor(null);
      toast({
        title: "Saved",
        description: `World map is now version ${res.version}. Players get it on next launch.`,
      });
    },
    onError: (err: Error) =>
      toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      fetchJson<{ ok: boolean; version: number }>(`/admin/world/objects/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (res) => {
      invalidate();
      setDeleting(null);
      toast({
        title: "Removed",
        description: `World map is now version ${res.version}.`,
      });
    },
    onError: (err: Error) =>
      toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
  });

  if (mapQuery.isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const objects = mapQuery.data?.objects ?? [];
  const filtered =
    kindFilter === "all" ? objects : objects.filter((o) => o.kind === kindFilter);
  const counts = new Map<string, number>();
  for (const o of objects) counts.set(o.kind, (counts.get(o.kind) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="w-44" data-testid="select-kind-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All kinds ({objects.length})</SelectItem>
              {WORLD_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k} ({counts.get(k) ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Map v{mapQuery.data?.version}
          </p>
        </div>
        <Button
          onClick={() =>
            setEditor({ id: null, kind: "building", json: '{\n  "position": [0, 0]\n}' })
          }
          data-testid="button-add-object"
        >
          <Plus className="w-4 h-4 mr-1" /> Add object
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {filtered.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground text-center">
            No objects{kindFilter !== "all" ? ` of kind "${kindFilter}"` : ""}.
          </p>
        )}
        {filtered.map((obj) => (
          <div
            key={obj.id}
            className="flex items-center gap-3 px-4 py-3"
            data-testid={`row-object-${obj.id}`}
          >
            <span className="text-[10px] font-mono text-muted-foreground w-10 shrink-0">
              #{obj.id}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide shrink-0">
              {obj.kind}
            </span>
            <span className="text-sm text-muted-foreground truncate flex-1">
              {objectSummary(obj.data)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setEditor({
                  id: obj.id,
                  kind: obj.kind,
                  json: JSON.stringify(obj.data, null, 2),
                })
              }
              data-testid={`button-edit-${obj.id}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(obj)}
              data-testid={`button-delete-${obj.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editor?.id === null ? "Add world object" : `Edit object #${editor?.id}`}
            </DialogTitle>
          </DialogHeader>
          {editor && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1.5">Kind</p>
                <Select
                  value={editor.kind}
                  onValueChange={(kind) => setEditor({ ...editor, kind })}
                >
                  <SelectTrigger data-testid="select-editor-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORLD_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">Data (JSON)</p>
                <Textarea
                  value={editor.json}
                  onChange={(e) => setEditor({ ...editor, json: e.target.value })}
                  rows={12}
                  className="font-mono text-xs"
                  data-testid="textarea-editor-json"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Position, size, colors, NPC persona etc. — same shape the game
                  reads from the world map.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editor && save.mutate(editor)}
              disabled={save.isPending}
              data-testid="button-save-object"
            >
              {save.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete object #{deleting?.id}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the {deleting?.kind} from the city for all players. This
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && remove.mutate(deleting.id)}
              disabled={remove.isPending}
              data-testid="button-confirm-delete"
            >
              {remove.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModelTab({ settings }: { settings: AdminSettings }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customModel, setCustomModel] = useState("");

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
      toast({ title: "Model updated", description: `NPC AI model is now ${data.model}` });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to update", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-semibold mb-1">NPC chat model</h2>
        <p className="text-sm font-mono text-primary" data-testid="text-current-model">
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
                  <p className="text-xs text-muted-foreground mt-1">{opt.note}</p>
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
          Any model ID from openrouter.ai/models. Paid models need OpenRouter credits.
        </p>
      </div>
    </div>
  );
}

interface GameAsset {
  id: string;
  category: "model" | "texture" | "avatar" | "scene";
  slot: "male" | "female" | "lobby" | "loading" | null;
  label: string;
  fileName: string;
  hash: string;
  size: number;
  mime: string;
  version: number;
  enabled: boolean;
  meta: Record<string, unknown>;
  previewUrl: string | null;
  updatedAt: string;
}

const ASSET_CATEGORIES = ["model", "texture", "avatar", "scene"] as const;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface AssetEditorState {
  id: string;
  category: GameAsset["category"];
  label: string;
  slot: "none" | "male" | "female" | "lobby" | "loading";
  meta: string;
  file: File | null;
  replacing: boolean;
}

function AssetsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<AssetEditorState | null>(null);
  const [deleting, setDeleting] = useState<GameAsset | null>(null);

  const listQuery = useQuery<{ configured: boolean; assets: GameAsset[] }>({
    queryKey: ["admin-assets"],
    queryFn: () => fetchJson("/admin/assets"),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-assets"] });

  const upload = useMutation({
    mutationFn: async (state: AssetEditorState) => {
      if (!state.file) throw new Error("Choose a file to upload");
      if (state.meta.trim()) {
        try {
          JSON.parse(state.meta);
        } catch {
          throw new Error("Meta must be valid JSON");
        }
      }
      const form = new FormData();
      form.append("file", state.file);
      form.append("id", state.id.trim());
      form.append("category", state.category);
      form.append("label", state.label.trim());
      if (state.slot !== "none") form.append("slot", state.slot);
      if (state.meta.trim()) form.append("meta", state.meta.trim());
      return fetchJson<{ manifestVersion: number }>("/admin/assets", {
        method: "POST",
        body: form,
      });
    },
    onSuccess: (res) => {
      invalidate();
      setEditor(null);
      toast({
        title: "Asset saved",
        description: `Manifest is now v${res.manifestVersion}. Players download it on next launch.`,
      });
    },
    onError: (err: Error) =>
      toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const setSlot = useMutation({
    mutationFn: (vars: { id: string; slot: string }) =>
      fetchJson<{ manifestVersion: number }>(`/admin/assets/${vars.id}/slot`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: vars.slot }),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Slot updated" });
    },
    onError: (err: Error) =>
      toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/admin/assets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast({ title: "Asset deleted" });
    },
    onError: (err: Error) =>
      toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
  });

  if (listQuery.isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const configured = listQuery.data?.configured ?? false;
  const assets = listQuery.data?.assets ?? [];

  return (
    <div className="space-y-4">
      {!configured && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          Cloud storage (R2) is not configured on the server — uploads are disabled.
        </div>
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {assets.length} asset{assets.length === 1 ? "" : "s"} · models, textures &amp; avatars
        </p>
        <Button
          disabled={!configured}
          onClick={() =>
            setEditor({
              id: "",
              category: "model",
              label: "",
              slot: "none",
              meta: "",
              file: null,
              replacing: false,
            })
          }
          data-testid="button-add-asset"
        >
          <UploadCloud className="w-4 h-4 mr-1" /> Upload asset
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {assets.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground text-center">
            No assets yet. Upload models, textures or avatars to serve them from the CDN.
          </p>
        )}
        {assets.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 px-4 py-3"
            data-testid={`row-asset-${a.id}`}
          >
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {a.category === "texture" && a.previewUrl ? (
                <img
                  src={a.previewUrl}
                  alt={a.label}
                  className="w-full h-full object-cover"
                />
              ) : a.category === "texture" ? (
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Package className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{a.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide shrink-0">
                  {a.category}
                </span>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground truncate">
                {a.id} · v{a.version} · {formatBytes(a.size)}
              </p>
            </div>
            {a.category === "avatar" && (
              <Select
                value={a.slot ?? "none"}
                onValueChange={(slot) => setSlot.mutate({ id: a.id, slot })}
              >
                <SelectTrigger className="w-28 h-8" data-testid={`select-slot-${a.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No slot</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            )}
            {a.category === "scene" && (
              <Select
                value={a.slot ?? "none"}
                onValueChange={(slot) => setSlot.mutate({ id: a.id, slot })}
              >
                <SelectTrigger className="w-36 h-8" data-testid={`select-slot-${a.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No slot</SelectItem>
                  <SelectItem value="lobby">Lobby room</SelectItem>
                  <SelectItem value="loading">Loading screen</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              disabled={!configured}
              onClick={() =>
                setEditor({
                  id: a.id,
                  category: a.category,
                  label: a.label,
                  slot: a.slot ?? "none",
                  meta: Object.keys(a.meta).length ? JSON.stringify(a.meta, null, 2) : "",
                  file: null,
                  replacing: true,
                })
              }
              data-testid={`button-replace-${a.id}`}
            >
              <UploadCloud className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(a)}
              data-testid={`button-delete-asset-${a.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editor?.replacing ? `Replace "${editor?.id}"` : "Upload asset"}
            </DialogTitle>
          </DialogHeader>
          {editor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium mb-1.5">Asset ID</p>
                  <Input
                    value={editor.id}
                    disabled={editor.replacing}
                    onChange={(e) => setEditor({ ...editor, id: e.target.value })}
                    placeholder="e.g. knight"
                    data-testid="input-asset-id"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1.5">Category</p>
                  <Select
                    value={editor.category}
                    onValueChange={(category) =>
                      setEditor({ ...editor, category: category as GameAsset["category"] })
                    }
                  >
                    <SelectTrigger data-testid="select-asset-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">Label</p>
                <Input
                  value={editor.label}
                  onChange={(e) => setEditor({ ...editor, label: e.target.value })}
                  placeholder="Human-friendly name"
                  data-testid="input-asset-label"
                />
              </div>
              {editor.category === "avatar" && (
                <div>
                  <p className="text-sm font-medium mb-1.5">Slot</p>
                  <Select
                    value={editor.slot}
                    onValueChange={(slot) =>
                      setEditor({ ...editor, slot: slot as AssetEditorState["slot"] })
                    }
                  >
                    <SelectTrigger data-testid="select-asset-slot">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No slot</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editor.category === "scene" && (
                <div>
                  <p className="text-sm font-medium mb-1.5">Scene slot</p>
                  <Select
                    value={editor.slot}
                    onValueChange={(slot) =>
                      setEditor({ ...editor, slot: slot as AssetEditorState["slot"] })
                    }
                  >
                    <SelectTrigger data-testid="select-asset-slot">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No slot</SelectItem>
                      <SelectItem value="lobby">Lobby room (3D .glb)</SelectItem>
                      <SelectItem value="loading">Loading screen (image)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Lobby room = a .glb the character stands in. Loading screen =
                    a background image shown while the game loads.
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-1.5">
                  File {editor.replacing && "(new version)"}
                </p>
                <Input
                  type="file"
                  accept=".glb,.gltf,.jpg,.jpeg,.png,.webp,.ktx2"
                  onChange={(e) =>
                    setEditor({ ...editor, file: e.target.files?.[0] ?? null })
                  }
                  data-testid="input-asset-file"
                />
                {editor.file && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {editor.file.name} · {formatBytes(editor.file.size)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">Meta (JSON, optional)</p>
                <Textarea
                  value={editor.meta}
                  onChange={(e) => setEditor({ ...editor, meta: e.target.value })}
                  rows={4}
                  className="font-mono text-xs"
                  placeholder='{ "scale": 1.2 }'
                  data-testid="textarea-asset-meta"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editor && upload.mutate(editor)}
              disabled={upload.isPending || !editor?.file || !editor?.id.trim()}
              data-testid="button-save-asset"
            >
              {upload.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              {editor?.replacing ? "Replace" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete "{deleting?.label}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the asset from the CDN and manifest. Players fall back to the
            bundled version. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && remove.mutate(deleting.id)}
              disabled={remove.isPending}
              data-testid="button-confirm-delete-asset"
            >
              {remove.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logout = useLogout();

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
          <p className="text-muted-foreground text-sm mb-4">
            {status === 403
              ? "This account does not have admin access."
              : "Log in with an admin account to view this page."}
          </p>
          {status !== 403 && (
            <Button onClick={() => setLocation("/login")} data-testid="button-go-login">
              Go to login
            </Button>
          )}
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
        className="max-w-3xl mx-auto space-y-8"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold" data-testid="text-admin-title">
              Neura City Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage the city world and NPC AI
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: getGetCurrentUserQueryKey(),
                  });
                  setLocation("/");
                },
              })
            }
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-1" /> Log out
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="Players"
            value={statsQuery.data?.users ?? "—"}
            testId="text-stat-users"
          />
          <StatCard
            icon={Boxes}
            label="World objects"
            value={statsQuery.data?.worldObjects ?? "—"}
            testId="text-stat-objects"
          />
          <StatCard
            icon={MapIcon}
            label="Map version"
            value={statsQuery.data?.worldVersion ?? "—"}
            testId="text-stat-version"
          />
        </div>

        <Tabs defaultValue="world">
          <TabsList>
            <TabsTrigger value="world" data-testid="tab-world">
              World objects
            </TabsTrigger>
            <TabsTrigger value="assets" data-testid="tab-assets">
              Assets
            </TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai">
              NPC AI
            </TabsTrigger>
          </TabsList>
          <TabsContent value="world" className="mt-4">
            <WorldObjectsTab />
          </TabsContent>
          <TabsContent value="assets" className="mt-4">
            <AssetsTab />
          </TabsContent>
          <TabsContent value="ai" className="mt-4">
            <ModelTab settings={settings} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
