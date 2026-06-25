import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Film, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Reelhouse" },
      { name: "description", content: "Sign in to upload and manage movies in your Reelhouse library." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/", replace: true });
    } catch {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-hero)" }}>
      <Toaster theme="dark" position="top-center" />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="size-11 rounded-lg flex items-center justify-center"
            style={{ background: "var(--primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Film className="size-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Reelhouse</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Sign in to manage your library." : "Sign up to start uploading."}
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold hover:bg-secondary/80 disabled:opacity-50 transition"
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-input border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                className="w-full rounded-lg bg-input border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              style={{ boxShadow: "var(--shadow-glow)" }}
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.9 0 3.16.8 3.9 1.5l2.6-2.5C16.8 3.6 14.6 2.6 12 2.6 6.7 2.6 2.4 6.9 2.4 12.4S6.7 22.2 12 22.2c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2H12z"/>
    </svg>
  );
}
