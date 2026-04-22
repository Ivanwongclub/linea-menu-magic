import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(1, { message: "Password is required" }).max(128),
});

export default function DesignerStudioLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, session, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const next = searchParams.get("next") || "/designer-studio/dashboard";

  // If already signed in, bounce to next
  useEffect(() => {
    if (!loading && session) {
      navigate(next, { replace: true });
    }
  }, [loading, session, next, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: { email?: string; password?: string } = {};
      parsed.error.issues.forEach((issue) => {
        const k = issue.path[0] as "email" | "password";
        if (!errs[k]) errs[k] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setSubmitting(false);

    if (error) {
      if (/invalid login credentials/i.test(error)) {
        setAuthError("Invalid email or password. Please try again.");
      } else if (/email not confirmed/i.test(error)) {
        setAuthError("Email not confirmed. Please contact support.");
      } else {
        setAuthError("Sign in failed. Please try again in a moment.");
      }
      return;
    }

    navigate(next, { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 flex items-center justify-center border border-foreground">
            <Lock className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-light tracking-wide text-foreground">Designer Studio</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your brand workspace</p>
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

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <div className="border-t border-border pt-5 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Demo account</p>
            <div className="text-xs text-foreground/80 space-y-1 font-mono">
              <div>Email: demo.polo@wincyc.com</div>
              <div>Password: PoloDemo2026!</div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              For reviewers: signs you in as a Polo Ralph Lauren brand designer.
            </p>
          </div>
        </form>

        <div className="text-center">
          <Link
            to="/designer-studio"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Browse public catalog without signing in
          </Link>
        </div>
      </div>
    </div>
  );
}
