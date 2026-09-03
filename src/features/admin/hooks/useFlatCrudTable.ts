import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PublicTables = Database["public"]["Tables"];
export type TaxonomyTableName = keyof PublicTables;
export type TaxonomyRow<T extends TaxonomyTableName> = PublicTables[T]["Row"];
export type TaxonomyInsert<T extends TaxonomyTableName> = PublicTables[T]["Insert"];
export type TaxonomyUpdate<T extends TaxonomyTableName> = PublicTables[T]["Update"];

interface Options {
  /** Column to order the list by, ascending. Omit for tables with no sort_order (materials). */
  orderBy?: string;
}

/**
 * Generic CRUD + reorder data layer for the flat lookup tables (families,
 * categories, materials, attachments, compliance standards, the 8 finish
 * axes). `table` is constrained to a real `Database` table name, so every
 * call site still gets full column-name/type checking on `values` — the
 * `as` casts below are confined to this one generic boundary (Supabase's
 * client isn't generic-friendly across a union of tables), not spread across
 * call sites the way the old admin module's `tableName as any` was.
 */
export function useFlatCrudTable<T extends TaxonomyTableName>(table: T, opts: Options = {}) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-taxonomy", table] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase.from(table).select("*");
      if (opts.orderBy) {
        q = q.order(opts.orderBy, { ascending: true });
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as TaxonomyRow<T>[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: async (values: TaxonomyInsert<T>) => {
      const { error } = await supabase.from(table).insert(values as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TaxonomyUpdate<T> }) => {
      const { error } = await supabase.from(table).update(values as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from(table)
        .update({ is_active: isActive } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const results = await Promise.all(
        updates.map(({ id, sort_order }) =>
          supabase
            .from(table)
            .update({ sort_order } as never)
            .eq("id", id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { query, create, update, setActive, reorder, remove };
}
