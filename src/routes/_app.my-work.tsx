import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { STATUSES, STATUS_LABEL, type WorkStatus } from "@/lib/constants";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/my-work")({
  component: MyWorkPage,
});

function MyWorkPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const epics = useQuery({
    queryKey: ["mywork", "epics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("epics")
        .select("id,name,status,priority,target_date")
        .eq("owner_id", user!.id)
        .order("target_date", { ascending: true });
      return data ?? [];
    },
  });
  const stories = useQuery({
    queryKey: ["mywork", "stories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("id,name,status,priority,target_date")
        .eq("assignee_id", user!.id)
        .order("target_date", { ascending: true });
      return data ?? [];
    },
  });
  const tasks = useQuery({
    queryKey: ["mywork", "tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id,name,status,priority,target_date")
        .eq("assignee_id", user!.id)
        .order("target_date", { ascending: true });
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (v: { table: "epics" | "stories" | "tasks"; id: string; status: WorkStatus }) => {
      const { error } = await supabase.from(v.table).update({ status: v.status }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["mywork"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const Section = ({
    title,
    items,
    table,
  }: {
    title: string;
    items: { id: string; name: string; status: WorkStatus; priority: "p0" | "p1" | "p2" | "p3"; target_date: string | null }[];
    table: "epics" | "stories" | "tasks";
  }) => (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{title}</h3>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing assigned.</p>
        ) : (
          <ul className="divide-y">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{i.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <PriorityBadge priority={i.priority} />
                    <span>{i.target_date ? format(new Date(i.target_date), "MMM d") : "No date"}</span>
                  </div>
                </div>
                <StatusBadge status={i.status} />
                <Select
                  value={i.status}
                  onValueChange={(v) => update.mutate({ table, id: i.id, status: v as WorkStatus })}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader title="My Work" subtitle="Items assigned to you across products." />
      <div className="grid gap-4 p-6">
        <Section title="Epics I own" items={(epics.data ?? []) as never} table="epics" />
        <Section title="Stories assigned to me" items={(stories.data ?? []) as never} table="stories" />
        <Section title="Tasks assigned to me" items={(tasks.data ?? []) as never} table="tasks" />
      </div>
    </>
  );
}
