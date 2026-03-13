import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, Plus, Trash2, Pencil, Globe, GlobeLock, Archive, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBrochures } from "@/features/flipbook/hooks/useBrochures";
import { useBrochureMutations } from "@/features/flipbook/hooks/useBrochureMutations";
import type { Brochure, BrochureStatus } from "@/features/flipbook/types";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ------------------------------------------------------------------ */
/*  Page-count hook (batch)                                            */
/* ------------------------------------------------------------------ */

function usePageCounts(brochureIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!brochureIds.length) return;

    (async () => {
      const { data, error } = await supabase
        .from("flipbook_pages")
        .select("brochure_id")
        .in("brochure_id", brochureIds);

      if (error) return;

      const map: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        map[row.brochure_id] = (map[row.brochure_id] ?? 0) + 1;
      });
      setCounts(map);
    })();
  }, [brochureIds.join(",")]);

  return counts;
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

const statusConfig: Record<BrochureStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  published: { label: "Published", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  archived: { label: "Archived", className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
};

function StatusBadge({ status }: { status: BrochureStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}

/* ------------------------------------------------------------------ */
/*  Filter tabs                                                        */
/* ------------------------------------------------------------------ */

type FilterTab = "all" | BrochureStatus;

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface BrochuresPanelProps {
  onOpenEditor?: (brochureId?: string) => void;
}

export default function BrochuresPanel({ onOpenEditor }: BrochuresPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: brochures = [], isLoading } = useBrochures({ allStatuses: true });
  const { updateBrochure, deleteBrochure } = useBrochureMutations();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [deleteTarget, setDeleteTarget] = useState<Brochure | null>(null);

  // Page counts
  const brochureIds = useMemo(() => brochures.map((b) => b.id), [brochures]);
  const pageCounts = usePageCounts(brochureIds);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("brochures-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flipbook_brochures" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["flipbook-brochures"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filtering
  const filtered = useMemo(() => {
    return brochures.filter((b) => {
      const matchesSearch =
        !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = filterTab === "all" || b.status === filterTab;
      return matchesSearch && matchesTab;
    });
  }, [brochures, searchQuery, filterTab]);

  // Counts per status
  const counts = useMemo(() => {
    const map = { all: brochures.length, draft: 0, published: 0, archived: 0 };
    brochures.forEach((b) => {
      if (b.status in map) map[b.status as BrochureStatus]++;
    });
    return map;
  }, [brochures]);

  // Toggle publish
  const handleTogglePublish = (b: Brochure) => {
    const next: BrochureStatus = b.status === "published" ? "draft" : "published";
    updateBrochure.mutate(
      { id: b.id, status: next },
      {
        onSuccess: () => toast.success(`Brochure ${next === "published" ? "published" : "unpublished"}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  // Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteBrochure.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Brochure deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete brochure"),
    });
  };

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search brochures…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-2.5 h-6">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="published" className="text-xs px-2.5 h-6">Published ({counts.published})</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs px-2.5 h-6">Draft ({counts.draft})</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs px-2.5 h-6">Archived ({counts.archived})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        <Button
          size="sm"
          className="gap-1.5 h-8"
          onClick={() => onOpenEditor?.()}
        >
          <Plus className="w-3.5 h-3.5" />
          New Brochure
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No brochures found</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Pages</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id} className="group">
                  <TableCell>
                    <button
                      onClick={() => onOpenEditor?.(b.id)}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline underline-offset-2 text-left transition-colors"
                    >
                      {b.title}
                    </button>
                    {b.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
                        {b.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                    {pageCounts[b.id] ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(b.updated_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => onOpenEditor?.(b.id)}
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => handleTogglePublish(b)}
                      >
                        {b.status === "published" ? (
                          <>
                            <GlobeLock className="w-3 h-3" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3" />
                            Publish
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(b)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brochure</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTarget?.title}" and all its pages? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
