import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Brand {
  id: string;
  slug: string;
  name: string;
  role: "member" | "manager" | "owner";
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  brands: Brand[];
  primaryBrand: Brand | null;
  loading: boolean;
  membershipLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [membershipLoading, setMembershipLoading] = useState(false);

  const loadMemberships = useCallback(async (uid: string) => {
    setMembershipLoading(true);
    const { data, error } = await supabase
      .from("brand_memberships")
      .select("role, brands:brand_id ( id, slug, name, is_active )")
      .eq("user_id", uid);

    if (error) {
      setBrands([]);
      setMembershipLoading(false);
      return;
    }

    const list: Brand[] = (data ?? [])
      .map((row: any) => {
        const b = row.brands;
        if (!b || b.is_active === false) return null;
        return { id: b.id, slug: b.slug, name: b.name, role: row.role };
      })
      .filter(Boolean) as Brand[];

    setBrands(list);
    setMembershipLoading(false);
  }, []);

  useEffect(() => {
    // CRITICAL: subscribe BEFORE getSession (Supabase auth rule)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer to avoid deadlock inside the auth callback
        setTimeout(() => loadMemberships(newSession.user.id), 0);
      } else {
        setBrands([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadMemberships(data.session.user.id);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadMemberships]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const primaryBrand = brands[0] ?? null;

  return (
    <AuthContext.Provider
      value={{ session, user, brands, primaryBrand, loading, membershipLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
