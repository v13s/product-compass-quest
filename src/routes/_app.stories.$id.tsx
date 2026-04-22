import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_app/stories/$id")({
  component: StoryDetail,
});

function StoryDetail() {
  const { id } = Route.useParams();
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const story = useQuery({
    queryKey: ["story", id],
    queryFn: async () => (await supabase.from("stories").select("*").eq("id", id).single()).data,
  });
  const tasks = useQuery({
    queryKey: ["story", id, "tasks"],
    queryFn: async () => (await supabase.from("tasks").select("id,name,status,priority").eq("story_id", id)).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({ story_id: id, name });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Task added"); setOpen(false); setName(""); qc.invalidateQueries({ queryKey: ["story", id, "tasks"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!story.data) return <PageHeader title="Loading…" />;
  return (
    <>
      <PageHeader
        title={story.data.name}
        actions={
          canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add task</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
                <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <DialogFooter><Button onClick={() => create.mutate()} disabled={!name}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />
      <div className="p-6">
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks">
            <Card><CardContent className="p-4">
              {(tasks.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                <ul className="divide-y">
                  {(tasks.data ?? []).map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                      <span>{t.name}</span>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={t.priority as never} />
                        <StatusBadge status={t.status as never} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="comments">
            <CommentsPanel entityType="story" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
