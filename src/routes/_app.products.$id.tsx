import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format } from "date-fns";
import { STATUSES, STATUS_LABEL, PRIORITIES, PRIORITY_LABEL } from "@/lib/constants";
import { CommentsPanel } from "@/components/CommentsPanel";

export const Route = createFileRoute("/_app/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { canEdit } = useAuth();
  const qc = useQueryClient();

  const product = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, portfolios(name)").eq("id", id).single();
      return data;
    },
  });
  const epics = useQuery({
    queryKey: ["product", id, "epics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("epics")
        .select("id,name,status,priority,target_date")
        .eq("product_id", id)
        .order("priority");
      return data ?? [];
    },
  });
  const releases = useQuery({
    queryKey: ["product", id, "releases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("releases")
        .select("id,name,status,target_date")
        .eq("product_id", id)
        .order("target_date");
      return data ?? [];
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("p2");
  const [status, setStatus] = useState("planned");
  const [target, setTarget] = useState("");

  const createEpic = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("epics").insert({
        product_id: id,
        name,
        description: desc || null,
        priority: priority as never,
        status: status as never,
        target_date: target || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Epic created");
      setOpen(false); setName(""); setDesc(""); setTarget("");
      qc.invalidateQueries({ queryKey: ["product", id, "epics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!product.data) return <PageHeader title="Loading…" />;
  return (
    <>
      <PageHeader
        title={product.data.name}
        subtitle={
          (product.data.portfolios as { name?: string } | null)?.name
            ? `Portfolio: ${(product.data.portfolios as { name?: string }).name}`
            : undefined
        }
        actions={
          canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add epic</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New epic</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
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
                </div>
                <DialogFooter><Button onClick={() => createEpic.mutate()} disabled={!name || createEpic.isPending}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="epics">Epics</TabsTrigger>
            <TabsTrigger value="releases">Releases</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card><CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={product.data.status as never} />
                <PriorityBadge priority={product.data.priority as never} />
                <span className="text-xs text-muted-foreground">
                  {product.data.target_date ? `Target ${format(new Date(product.data.target_date), "MMM d, yyyy")}` : "No target"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.data.description || "No description."}
              </p>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="epics">
            <Card><CardContent className="p-4">
              {(epics.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No epics yet.</p>
              ) : (
                <ul className="divide-y">
                  {(epics.data ?? []).map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-2">
                      <Link to="/epics/$id" params={{ id: e.id }} className="text-sm font-medium hover:underline">{e.name}</Link>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={e.priority as never} />
                        <StatusBadge status={e.status as never} />
                        <span className="text-xs text-muted-foreground">
                          {e.target_date ? format(new Date(e.target_date), "MMM d") : "—"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="releases">
            <Card><CardContent className="p-4">
              {(releases.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No releases yet.</p>
              ) : (
                <ul className="divide-y">
                  {(releases.data ?? []).map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2">
                      <Link to="/releases/$id" params={{ id: r.id }} className="text-sm font-medium hover:underline">{r.name}</Link>
                      <span className="text-xs text-muted-foreground">
                        {r.target_date ? format(new Date(r.target_date), "MMM d, yyyy") : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="comments">
            <CommentsPanel entityType="product" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
