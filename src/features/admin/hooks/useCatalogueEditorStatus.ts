import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface CatalogueEditorStatus {
  isEditor: boolean;
  loading: boolean;
}

interface CheckedFor {
  uid: string;
  isEditor: boolean;
  checking: boolean;
}

/**
 * Calls the same `user_is_catalogue_editor(uuid)` predicate every RLS policy
 * on the catalogue tables already uses (SECURITY DEFINER, granted to
 * `authenticated`) rather than reading `catalogue_editors` directly — the
 * client-side gate and the database enforcement can then never disagree.
 * `catalogue_editors` itself is only readable as one's own row anyway, so a
 * raw select would answer the same question with more moving parts.
 */
export function useCatalogueEditorStatus(): CatalogueEditorStatus {
  const { session, loading: authLoading } = useAuth();
  const uid = session?.user?.id ?? null;

  const [checked, setChecked] = useState<CheckedFor | null>(null);

  useEffect(() => {
    if (!uid) {
      setChecked(null);
      return;
    }

    let cancelled = false;
    setChecked({ uid, isEditor: false, checking: true });

    supabase.rpc("user_is_catalogue_editor", { _user_id: uid }).then(({ data, error }) => {
      if (cancelled) return;
      setChecked({ uid, isEditor: !error && data === true, checking: false });
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // `checked` can briefly lag a changed `uid` (e.g. right after sign-in) between
  // render and effect commit — treat that window as still loading rather than
  // flashing the previous user's (or no user's) result.
  const forCurrentUser = checked?.uid === uid ? checked : null;

  return {
    isEditor: forCurrentUser?.isEditor ?? false,
    loading: authLoading || (!!uid && (!forCurrentUser || forCurrentUser.checking)),
  };
}
