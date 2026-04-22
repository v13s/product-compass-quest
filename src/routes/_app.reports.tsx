import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const releases = useQuery({
    queryKey: ["report", "releases"],
    queryFn: async () => (await supabase.from("releases").select("name,status,target_date,released_at, products(name)")).data ?? [],
  });
  const initiatives = useQuery({
    queryKey: ["report", "initiatives"],
    queryFn: async () => (await supabase.from("initiatives").select("name,status,priority,target_date, initiative_types(label)")).data ?? [],
  });
  const workload = useQuery({
    queryKey: ["report", "workload"],
    queryFn: async () => {
      const [epics, stories, tasks] = await Promise.all([
        supabase.from("epics").select("name,status,owner_id, profiles:owner_id(full_name)"),
        supabase.from("stories").select("name,status,assignee_id, profiles:assignee_id(full_name)"),
        supabase.from("tasks").select("name,status,assignee_id, profiles:assignee_id(full_name)"),
      ]);
      return [
        ...(epics.data ?? []).map((e) => ({ type: "Epic", name: e.name, status: e.status, person: (e.profiles as { full_name?: string } | null)?.full_name ?? "Unassigned" })),
        ...(stories.data ?? []).map((s) => ({ type: "Story", name: s.name, status: s.status, person: (s.profiles as { full_name?: string } | null)?.full_name ?? "Unassigned" })),
        ...(tasks.data ?? []).map((t) => ({ type: "Task", name: t.name, status: t.status, person: (t.profiles as { full_name?: string } | null)?.full_name ?? "Unassigned" })),
      ];
    },
  });

  return (
    <>
      <PageHeader title="Reports" subtitle="Plans, workload, and breakdowns. Export as CSV." />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        <ReportCard
          title="Release plan"
          description="All releases with product, status, and target date."
          count={(releases.data ?? []).length}
          onExport={() =>
            downloadCSV(
              "release-plan.csv",
              (releases.data ?? []).map((r) => ({
                name: r.name,
                product: (r.products as { name?: string } | null)?.name ?? "",
                status: r.status,
                target_date: r.target_date,
                released_at: r.released_at,
              })),
            )
          }
        />
        <ReportCard
          title="Initiatives by type"
          description="Initiative inventory with type, status, priority, and target."
          count={(initiatives.data ?? []).length}
          onExport={() =>
            downloadCSV(
              "initiatives.csv",
              (initiatives.data ?? []).map((i) => ({
                name: i.name,
                type: (i.initiative_types as { label?: string } | null)?.label ?? "",
                status: i.status,
                priority: i.priority,
                target_date: i.target_date,
              })),
            )
          }
        />
        <ReportCard
          title="Workload"
          description="Epics, stories, and tasks grouped by assignee."
          count={(workload.data ?? []).length}
          onExport={() => downloadCSV("workload.csv", workload.data ?? [])}
        />
      </div>
    </>
  );
}

function ReportCard({
  title, description, count, onExport,
}: {
  title: string; description: string; count: number; onExport: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{count}</p>
          </div>
          <Button size="sm" variant="outline" onClick={onExport}>
            <Download className="mr-1.5 h-4 w-4" /> CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
