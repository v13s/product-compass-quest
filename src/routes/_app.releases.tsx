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
import { Plus, Tag } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format } from "date-fns";
import { RELEASE_STATUSES, RELEASE_STATUS_LABEL } from "@/lib/constants";

export const Route = createFileRoute("/_app/releases")({
  component: ReleasesPage,
});

function ReleasesPage() {
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const releases = useQuery({
    queryKey: ["releases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("releases")
        .select("id,name,description,status,target_date,released_at,product_id, products(name)")
        .order("target_date", { ascending: true });
      return data ?? [];
    },
  });
  const products = useQuery({
    queryKey: ["products", "lite"],
    queryFn: async () => (await supabase.from("products").select("id,name")).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [productId, setProductId] = useState<string>("none");
  const [status, setStatus] = useState("planned");
  const [target, setTarget] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("releases").insert({
        name,
        description: desc || null,
        product_id: productId === "none" ? null : productId,
        status: status as never,
        target_date: target || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Release created");
      setOpen(false); setName(""); setDesc(""); setProductId("none"); setTarget("");
      qc.invalidateQueries({ queryKey: ["releases"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Releases"
        subtitle="Milestones grouping epics and stories."
        actions={
          canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> New release</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New release</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label>Product</Label>
                    <Select value={productId} onValueChange={setProductId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {(products.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{RELEASE_STATUSES.map((s) => <SelectItem key={s} value={s}>{RELEASE_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Target date</Label><Input type="date" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
                  </div>
                </div>
                <DialogFooter><Button onClick={() => create.mutate()} disabled={!name || create.isPending}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />
      <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {(releases.data ?? []).map((r) => (
          <Link key={r.id} to="/releases/$id" params={{ id: r.id }}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(r.products as { name?: string } | null)?.name ?? "No product"}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="rounded-md border bg-muted/40 px-2 py-0.5">
                        {RELEASE_STATUS_LABEL[r.status as never]}
                      </span>
                      <span className="text-muted-foreground">
                        {r.target_date ? format(new Date(r.target_date), "MMM d, yyyy") : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(releases.data ?? []).length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">No releases yet.</p>
        )}
      </div>
    </>
  );
}
