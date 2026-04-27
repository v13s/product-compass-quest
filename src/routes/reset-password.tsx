import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Map } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands from the email link.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Fallback: if a session already exists (link processed), allow reset.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Map className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Roadmapr</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Set a new password</h2>
          <p className="mt-3 text-muted-foreground">
            Choose a strong password — at least 8 characters.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© Roadmapr</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          {!ready ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Verifying your reset link… If nothing happens, request a new link from{" "}
              <Link to="/forgot-password" className="underline">
                Forgot password
              </Link>
              .
            </p>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (password.length < 8) {
                  toast.error("Password must be at least 8 characters.");
                  return;
                }
                if (password !== confirm) {
                  toast.error("Passwords do not match.");
                  return;
                }
                setBusy(true);
                const { error } = await supabase.auth.updateUser({ password });
                setBusy(false);
                if (error) {
                  toast.error(error.message);
                  return;
                }
                toast.success("Password updated — you're signed in.");
                navigate({ to: "/" });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="pw">New password</Label>
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2">Confirm password</Label>
                <Input
                  id="pw2"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy}>
                {busy ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
