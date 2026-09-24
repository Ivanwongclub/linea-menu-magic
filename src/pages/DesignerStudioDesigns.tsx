import { Link, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";

interface DesignListRow {
  id: string;
  name: string;
  status: string;
  updated_at: string;
  draft_updated_at: string | null;
  product: { slug: string; name: string; item_code: string | null } | null;
  versions: number;
}

/**
 * Every design the signed-in buyer can see, newest work first. RLS decides
 * the set (own designs, their brand's, anything shared with them, everything
 * for staff) — this query asks for no filter of its own, so a salesperson and
 * a buyer get the same page with different rows.
 */
async function fetchDesigns(): Promise<DesignListRow[]> {
  const { data, error } = await supabase
    .from("designs")
    // The embed is named by its FK: `designs` reaches `design_versions` two
    // ways — a design's versions, and the one `current_version_id` points at
    // (Phase 1's circular FK) — and an unqualified embed is PGRST201.
    .select(
      "id, name, status, updated_at, draft_updated_at, product:products ( slug, name, item_code ), " +
        "design_versions!design_versions_design_id_fkey ( id )",
    )
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    status: row.status as string,
    updated_at: row.updated_at as string,
    draft_updated_at: (row.draft_updated_at as string | null) ?? null,
    product: row.product
      ? { slug: row.product.slug as string, name: row.product.name as string, item_code: (row.product.item_code as string | null) ?? null }
      : null,
    versions: Array.isArray(row.design_versions) ? row.design_versions.length : 0,
  }));
}

/**
 * `/designer-studio/designs` — the design list (E1 open question 4: it has no
 * row of its own in the rulings' §7, and lands here with Phase 7's versions
 * because a named save is only worth anything if there is a way back to the
 * design that holds it).
 *
 * A product-less design still lists: the product row is `on delete set null`,
 * and a design whose catalogue product was retired is still the buyer's work.
 */
const DesignerStudioDesigns = () => {
  const { t } = useI18n();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["designer-studio-designs", session?.user?.id ?? null],
    queryFn: fetchDesigns,
    enabled: !!session,
  });

  if (authLoading) {
    return <div className="flex-1 px-6 py-20" />;
  }

  if (!session) {
    return <Navigate to={`/designer-studio/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return (
    <section className="px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6" data-testid="designs-page">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{t("designs.title")}</h1>
          <p className="max-w-md text-sm text-muted-foreground">{t("designs.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="h-3 w-40 animate-pulse bg-secondary" />
        ) : designs.length === 0 ? (
          <div className="space-y-3 border border-border p-6" data-testid="designs-empty">
            <p className="text-sm text-muted-foreground">{t("designs.empty")}</p>
            <Button asChild variant="outline" size="sm" className="rounded-none text-xs tracking-[0.05em]">
              <Link to="/designer-studio/trim-library">{t("designs.emptyCta")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border" data-testid="designs-list">
            {designs.map((design) => (
              <li key={design.id} className="flex items-center gap-4 p-4" data-testid="design-row" data-design-id={design.id}>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm text-foreground" data-testid="design-name">
                    {design.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {design.product ? `${design.product.name}${design.product.item_code ? ` · ${design.product.item_code}` : ""}` : t("designs.noProduct")}
                  </p>
                  <p className="text-[11px] text-muted-foreground" data-testid="design-meta" data-versions={design.versions}>
                    {t("designs.versions", { n: design.versions })} ·{" "}
                    {t("designs.updated", { when: new Date(design.draft_updated_at ?? design.updated_at).toLocaleString() })}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0 rounded-none text-xs tracking-[0.05em]" data-testid="design-open">
                  <Link to={`/designer-studio/editor/${design.id}`}>{t("designs.open")}</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default DesignerStudioDesigns;
