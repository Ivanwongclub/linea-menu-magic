import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDesignSessions } from "@/features/designer/hooks/useDesignSessions";

interface CompositionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productImageUrl?: string;
  onAdded?: () => void;
}

/** P17 T3: add a product to a composition.
 *  - 0 compositions: only "+ Start new" branch
 *  - 1 composition: skip the dialog, insert directly, toast with "Open →" link
 *  - 2+ compositions: full picker with list of sessions
 *
 *  All design_layers inserts carry session_id linked to the user's team —
 *  RLS at the design_layers level (P14) enforces team membership via
 *  the session join, so no extra .eq('team_id', …) is needed here. */
export default function CompositionPickerDialog({
  open,
  onOpenChange,
  productId,
  productName,
  productImageUrl,
  onAdded,
}: CompositionPickerDialogProps) {
  const navigate = useNavigate();
  const { primaryBrand } = useAuth();
  const teamId = primaryBrand?.id ?? "";
  const { sessions, loading, createSession } = useDesignSessions(teamId);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [shortcutFired, setShortcutFired] = useState(false);

  // Insert a layer for the product into the given session.
  async function insertLayer(sessionId: string): Promise<boolean> {
    const { data: existingLayers } = await supabase
      .from("design_layers")
      .select("layer_order")
      .eq("session_id", sessionId)
      .order("layer_order", { ascending: false })
      .limit(1);
    const nextOrder = ((existingLayers?.[0]?.layer_order as number) ?? 0) + 1;

    const { error } = await supabase.from("design_layers").insert({
      session_id: sessionId,
      product_id: productId,
      layer_order: nextOrder,
      name: productName,
      image_url: productImageUrl ?? null,
    });

    if (error) {
      toast.error("Failed to add to composition");
      return false;
    }
    return true;
  }

  async function handlePickExisting(sessionId: string, sessionName: string) {
    setSubmitting(sessionId);
    const ok = await insertLayer(sessionId);
    setSubmitting(null);
    if (!ok) return;
    onOpenChange(false);
    toast.success(`Added to ${sessionName}`, {
      action: {
        label: "Open →",
        onClick: () => navigate(`/designer-studio/compose/${sessionId}`),
      },
    });
    onAdded?.();
  }

  async function handleStartNew() {
    setSubmitting("__new__");
    try {
      const session = await createSession("Untitled Composition");
      const ok = await insertLayer(session.id);
      setSubmitting(null);
      if (!ok) return;
      onOpenChange(false);
      navigate(`/designer-studio/compose/${session.id}`);
    } catch {
      setSubmitting(null);
      toast.error("Failed to create composition");
    }
  }

  // T3.4: when there's exactly one composition, skip the dialog and add directly.
  useEffect(() => {
    if (!open || loading || shortcutFired) return;
    if (sessions.length === 1) {
      setShortcutFired(true);
      void handlePickExisting(sessions[0].id, sessions[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, sessions.length, shortcutFired]);

  // Reset the shortcut latch when the dialog closes so a future open re-evaluates.
  useEffect(() => {
    if (!open) setShortcutFired(false);
  }, [open]);

  // When there's exactly one session we render nothing — the effect above handles it.
  if (open && !loading && sessions.length === 1 && shortcutFired) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Open in Composer</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pick a composition to add <span className="text-foreground">{productName}</span> to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {loading && (
            <p className="text-xs text-muted-foreground text-center py-6">Loading…</p>
          )}

          {!loading && sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              You don't have any compositions yet.
            </p>
          )}

          {!loading &&
            sessions.map((s) => (
              <button
                key={s.id}
                disabled={submitting !== null}
                onClick={() => handlePickExisting(s.id, s.name)}
                className="w-full flex items-center gap-3 px-3 py-2 border border-border bg-background hover:border-foreground transition-colors text-left disabled:opacity-50"
              >
                <Layers className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="flex-1 text-sm truncate">{s.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              </button>
            ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-2 gap-2 rounded-none"
          disabled={submitting !== null}
          onClick={handleStartNew}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          {sessions.length === 0 ? "Start a new composition" : "+ New composition"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
