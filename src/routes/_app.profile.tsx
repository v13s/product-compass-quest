import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refreshRoles, roles } = useAuth();
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setTeam(profile?.team ?? "");
  }, [profile]);

  return (
    <>
      <PageHeader title="My profile" subtitle="Update your personal info." />
      <div className="p-6">
        <Card className="max-w-lg">
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Input value={team} onChange={(e) => setTeam(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-1.5">
                {roles.length === 0 && <span className="text-xs text-muted-foreground">No roles assigned.</span>}
                {roles.map((r) => (
                  <span key={r} className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs">{r}</span>
                ))}
              </div>
            </div>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const { error } = await supabase
                  .from("profiles")
                  .update({ full_name: name, team })
                  .eq("id", user!.id);
                setBusy(false);
                if (error) toast.error(error.message);
                else { toast.success("Profile updated"); refreshRoles(); }
              }}
            >
              Save
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
