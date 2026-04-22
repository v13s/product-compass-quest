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
import { Plus, Box } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const { canEdit, user } = useAuth();
  const qc = useQueryClient();
  const products = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,description,status,priority,target_date,portfolio_id, portfolios(name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const portfolios = useQuery({
    queryKey: ["portfolios", "lite"],
    queryFn: async () => (await supabase.from("portfolios").select("id,name")).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [portfolioId, setPortfolioId] = useState<string>("none");
  const [target, setTarget] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        name,
        description: desc || null,
        owner_id: user!.id,
        portfolio_id: portfolioId === "none" ? null : portfolioId,
        target_date: target || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product created");
      setOpen(false);
      setName(""); setDesc(""); setPortfolioId("none"); setTarget("");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="The catalog of what your teams build."
        actions={
          canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New product</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New product</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label>Portfolio</Label>
                    <Select value={portfolioId} onValueChange={setPortfolioId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {(portfolios.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Target date</Label><Input type="date" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
                </div>
                <DialogFooter><Button onClick={() => create.mutate()} disabled={!name || create.isPending}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {(products.data ?? []).map((p) => (
          <Link key={p.id} to="/products/$id" params={{ id: p.id }}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                    <Box className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(p.portfolios as { name?: string } | null)?.name ?? "No portfolio"}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status as never} />
                      <PriorityBadge priority={p.priority as never} />
                      <span className="text-xs text-muted-foreground">
                        {p.target_date ? format(new Date(p.target_date), "MMM d, yyyy") : "No target"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(products.data ?? []).length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">No products yet.</p>
        )}
      </div>
    </>
  );
}
