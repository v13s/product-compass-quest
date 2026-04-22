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
import { Plus, Briefcase } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/portfolios")({
  component: PortfoliosPage,
});

function PortfoliosPage() {
  const { canEdit, user } = useAuth();
  const qc = useQueryClient();
  const portfolios = useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("portfolios")
        .select("id,name,description,owner_id, products:products(count)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("portfolios")
        .insert({ name, description: desc || null, owner_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Portfolio created");
      setOpen(false);
      setName("");
      setDesc("");
      qc.invalidateQueries({ queryKey: ["portfolios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Portfolios"
        subtitle="Top-level grouping of products and initiatives."
        actions={
          canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New portfolio</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New portfolio</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {(portfolios.data ?? []).map((p) => (
          <Link key={p.id} to="/portfolios/$id" params={{ id: p.id }}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {p.description || "No description"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(portfolios.data ?? []).length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">
            No portfolios yet.
          </p>
        )}
      </div>
    </>
  );
}
