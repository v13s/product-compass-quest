import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { format } from "date-fns";
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL } from "@/lib/constants";

export const Route = createFileRoute("/_app/initiatives")({
  component: InitiativesPage,
});

function InitiativesPage() {
  const { canEdit, user } = useAuth();
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = useQuery({
    queryKey: ["initiative_types"],
    queryFn: async () => (await supabase.from("initiative_types").select("id,key,label,color,field_schema")).data ?? [],
  });
  const products = useQuery({
    queryKey: ["products", "lite"],
    queryFn: async () => (await supabase.from("products").select("id,name")).data ?? [],
  });
  const initiatives = useQuery({
    queryKey: ["initiatives", typeFilter],
    queryFn: async () => {
      let q = supabase
        .from("initiatives")
        .select("id,name,status,priority,target_date,custom_fields, initiative_types(label,color,key), initiative_products(product_id, products(name))")
        .order("created_at", { ascending: false });
      if (typeFilter !== "all") q = q.eq("type_id", typeFilter);
      return (await q).data ?? [];
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [typeId, setTypeId] = useState<string>("");
  const [priority, setPriority] = useState("p2");
  const [status, setStatus] = useState("planned");
  const [target, setTarget] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [custom, setCustom] = useState<Record<string, string>>({});

  const selectedType = (types.data ?? []).find((t) => t.id === typeId);
  const fields = (selectedType?.field_schema ?? []) as { key: string; label: string; type: string }[];

  const create = useMutation({
    mutationFn: async () => {
      const { data: ins, error } = await supabase
        .from("initiatives")
        .insert({
          name,
          description: desc || null,
          type_id: typeId || null,
          owner_id: user!.id,
          priority: priority as never,
          status: status as never,
          target_date: target || null,
          custom_fields: custom,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (productIds.length && ins) {
        const rows = productIds.map((pid) => ({ initiative_id: ins.id, product_id: pid }));
        await supabase.from("initiative_products").insert(rows);
      }
    },
    onSuccess: () => {
      toast.success("Initiative created");
      setOpen(false);
      setName(""); setDesc(""); setTypeId(""); setTarget(""); setProductIds([]); setCustom({});
      qc.invalidateQueries({ queryKey: ["initiatives"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Initiatives"
        subtitle="Cross-product efforts: customizations, demos, events, PoVs, and more."
        actions={
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(types.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {canEdit && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> New initiative</Button></DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>New initiative</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select value={typeId} onValueChange={(v) => { setTypeId(v); setCustom({}); }}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {(types.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {fields.length > 0 && (
                      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">Type-specific fields</div>
                        {fields.map((f) => (
                          <div key={f.key} className="space-y-1.5">
                            <Label>{f.label}</Label>
                            <Input
                              type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                              value={custom[f.key] ?? ""}
                              onChange={(e) => setCustom({ ...custom, [f.key]: e.target.value })}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5"><Label>Target date</Label><Input type="date" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
                    <div className="space-y-1.5">
                      <Label>Linked products (cross-product)</Label>
                      <div className="flex flex-wrap gap-2 rounded-md border p-2 max-h-40 overflow-auto">
                        {(products.data ?? []).map((p) => {
                          const active = productIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setProductIds(active ? productIds.filter((x) => x !== p.id) : [...productIds, p.id])}
                              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted"}`}
                            >
                              {p.name}
                            </button>
                          );
                        })}
                        {(products.data ?? []).length === 0 && <span className="text-xs text-muted-foreground">No products yet.</span>}
                      </div>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={() => create.mutate()} disabled={!name || create.isPending}>Create</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />
      <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {(initiatives.data ?? []).map((i) => {
          const t = i.initiative_types as { label?: string; color?: string } | null;
          const linked = (i.initiative_products as { products?: { name?: string } }[] | null) ?? [];
          return (
            <Link key={i.id} to="/initiatives/$id" params={{ id: i.id }}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: (t?.color || "#64748b") + "22", color: t?.color || "#64748b" }}
                    >
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{t?.label ?? "Other"}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={i.status as never} />
                        <PriorityBadge priority={i.priority as never} />
                        <span className="text-xs text-muted-foreground">
                          {i.target_date ? format(new Date(i.target_date), "MMM d, yyyy") : "No target"}
                        </span>
                      </div>
                      {linked.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {linked.slice(0, 3).map((lp, idx) => (
                            <span key={idx} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {lp.products?.name}
                            </span>
                          ))}
                          {linked.length > 3 && <span className="text-[10px] text-muted-foreground">+{linked.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {(initiatives.data ?? []).length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">No initiatives yet.</p>
        )}
      </div>
    </>
  );
}
