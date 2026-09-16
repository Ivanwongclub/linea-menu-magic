import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface DesignerStaffStatus {
  isStaff: boolean;
  loading: boolean;
}

interface CheckedFor {
  uid: string;
  isStaff: boolean;
  checking: boolean;
}

/**
 * Mirrors `useCatalogueEditorStatus`: calls the same `user_is_designer_staff`
 * security-definer RPC every `designs` RLS write policy uses, so the client
 * gate and the database enforcement can never disagree.
 */
export function useDesignerStaffStatus(): DesignerStaffStatus {
  const { session, loading: authLoading } = useAuth();
  const uid = session?.user?.id ?? null;

  const [checked, setChecked] = useState<CheckedFor | null>(null);

  useEffect(() => {
    if (!uid) {
      setChecked(null);
      return;
    }

    let cancelled = false;
    setChecked({ uid, isStaff: false, checking: true });

    supabase.rpc("user_is_designer_staff", { _user_id: uid }).then(({ data, error }) => {
      if (cancelled) return;
      setChecked({ uid, isStaff: !error && data === true, checking: false });
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const forCurrentUser = checked?.uid === uid ? checked : null;

  return {
    isStaff: forCurrentUser?.isStaff ?? false,
    loading: authLoading || (!!uid && (!forCurrentUser || forCurrentUser.checking)),
  };
}
