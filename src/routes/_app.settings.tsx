import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAuth, type AppRole } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { isAdmin, canEdit } = useAuth();
  if (!canEdit) {
    return (
      <>
        <PageHeader title="Settings" />
        <div className="p-6 text-sm text-muted-foreground">You don't have access to settings.</div>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Settings" subtitle="Initiative types and user roles." />
      <div className="p-6">
        <Tabs defaultValue="types">
          <TabsList>
            <TabsTrigger value="types">Initiative types</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Users & roles</TabsTrigger>}
          </TabsList>
          <TabsContent value="types"><InitiativeTypes /></TabsContent>
          {isAdmin && <TabsContent value="users"><Users /></TabsContent>}
        </Tabs>
      </div>
    </>
  );
}

function InitiativeTypes() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const types = useQuery({
    queryKey: ["initiative_types"],
    queryFn: async () => (await supabase.from("initiative_types").select("*").order("label")).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#64748b");
  const [fields, setFields] = useState<{ key: string; label: string; type: string }[]>([]);

  const create = useMutation({
    mutationFn: async () => {
      const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const { error } = await supabase.from("initiative_types").insert({
        key, label, color, built_in: false, field_schema: fields,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Type created");
      setOpen(false); setLabel(""); setColor("#64748b"); setFields([]);
      qc.invalidateQueries({ queryKey: ["initiative_types"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("initiative_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["initiative_types"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Initiative types</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> New type</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New initiative type</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Color</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Custom fields</Label>
                    <Button size="sm" variant="outline" onClick={() => setFields([...fields, { key: "", label: "", type: "text" }])}>
                      <Plus className="mr-1 h-3 w-3" /> Add field
                    </Button>
                  </div>
                  {fields.map((f, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <Input placeholder="Label" className="col-span-5" value={f.label} onChange={(e) => {
                        const copy = [...fields];
                        copy[idx] = { ...f, label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") };
                        setFields(copy);
                      }} />
                      <Select value={f.type} onValueChange={(v) => {
                        const copy = [...fields]; copy[idx] = { ...f, type: v }; setFields(copy);
                      }}>
                        <SelectTrigger className="col-span-5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="col-span-2" onClick={() => setFields(fields.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!label || create.isPending}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ul className="divide-y">
          {(types.data ?? []).map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color ?? "#64748b" }} />
                <div>
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {(t.field_schema as { label: string }[] | null)?.length ?? 0} field(s)
                    {t.built_in && <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px]">built-in</span>}
                  </div>
                </div>
              </div>
              {isAdmin && !t.built_in && (
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Users() {
  const qc = useQueryClient();
  const profiles = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("id,full_name,email").order("full_name")).data ?? [],
  });
  const allRoles = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => (await supabase.from("user_roles").select("user_id, role")).data ?? [],
  });
  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["all-roles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleByUser = new Map<string, AppRole>();
  (allRoles.data ?? []).forEach((r) => roleByUser.set(r.user_id, r.role as AppRole));

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Users</h3>
        <ul className="divide-y">
          {(profiles.data ?? []).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium">{p.full_name || "—"}</div>
                <div className="text-xs text-muted-foreground">{p.email}</div>
              </div>
              <Select
                value={roleByUser.get(p.id) ?? "member"}
                onValueChange={(v) => setRole.mutate({ userId: p.id, role: v as AppRole })}
              >
                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pm">Product Manager</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                  <SelectItem value="member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
