import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

function validateFields(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  const normalizedEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!normalizedEmail) {
    errors.email = "Email is required.";
  } else if (normalizedEmail.length > 255 || !emailRegex.test(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length > 128) {
    errors.password = "Password is too long.";
  }

  return { errors, normalizedEmail };
}

/**
 * The admin CMS's own front door — same Supabase Auth user pool as the rest
 * of the app (there is only one), but a distinct entry point and a distinct
 * post-login destination from the customer/brand designer-studio login.
 * Gating on catalogue_editors happens downstream in RequireCatalogueEditor,
 * not here — this page only needs a session to exist before it hands off.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, session, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const next = searchParams.get("next") || "/admin";

  useEffect(() => {
    if (!loading && session) {
      navigate(next, { replace: true });
    }
  }, [loading, session, next, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFieldErrors({});

    const { errors, normalizedEmail } = validateFields(email, password);
    if (errors.email || errors.password) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(normalizedEmail, password);
    setSubmitting(false);

    if (error) {
      if (/invalid login credentials/i.test(error)) {
        setAuthError("Incorrect email or password.");
      } else if (/email not confirmed/i.test(error)) {
        setAuthError("Confirm your email before signing in.");
      } else {
        setAuthError("Something went wrong signing in. Try again.");
      }
      return;
    }

    navigate(next, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 flex items-center justify-center border border-foreground">
            <Lock className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-light tracking-wide text-foreground">WIN-CYC Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage the catalogue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border border-border p-8 bg-background">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="rounded-none"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="rounded-none"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          {authError && (
            <div className="border border-destructive/40 bg-destructive/5 text-destructive text-xs px-3 py-2">
              {authError}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full rounded-none">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Back to wincyc.com
          </Link>
        </div>
      </div>
    </div>
  );
}
