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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { CommentsPanel } from "@/components/CommentsPanel";
import { DependenciesPanel } from "@/components/DependenciesPanel";

export const Route = createFileRoute("/_app/epics/$id")({
  component: EpicDetail,
});

function EpicDetail() {
  const { id } = Route.useParams();
  const { canEdit } = useAuth();
  const qc = useQueryClient();

  const epic = useQuery({
    queryKey: ["epic", id],
    queryFn: async () => (await supabase.from("epics").select("*, products(name)").eq("id", id).single()).data,
  });
  const stories = useQuery({
    queryKey: ["epic", id, "stories"],
    queryFn: async () =>
      (await supabase.from("stories").select("id,name,status,priority,target_date").eq("epic_id", id)).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("stories").insert({ epic_id: id, name });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Story added");
      setOpen(false); setName("");
      qc.invalidateQueries({ queryKey: ["epic", id, "stories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!epic.data) return <PageHeader title="Loading…" />;
  return (
    <>
      <PageHeader
        title={epic.data.name}
        subtitle={(epic.data.products as { name?: string } | null)?.name}
        actions={
          canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add story</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New story</DialogTitle></DialogHeader>
                <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <DialogFooter><Button onClick={() => create.mutate()} disabled={!name}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />
      <div className="p-6">
        <Tabs defaultValue="stories">
          <TabsList>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="stories">
            <Card><CardContent className="p-4">
              {(stories.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No stories yet.</p>
              ) : (
                <ul className="divide-y">
                  {(stories.data ?? []).map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-2">
                      <Link to="/stories/$id" params={{ id: s.id }} className="text-sm hover:underline">{s.name}</Link>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={s.priority as never} />
                        <StatusBadge status={s.status as never} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="overview">
            <Card><CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={epic.data.status as never} />
                <PriorityBadge priority={epic.data.priority as never} />
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{epic.data.description || "No description."}</p>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="dependencies">
            <DependenciesPanel entityType="epic" entityId={id} />
          </TabsContent>
          <TabsContent value="comments">
            <CommentsPanel entityType="epic" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
