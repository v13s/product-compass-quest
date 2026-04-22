import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Box, Lightbulb, Tag, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{label}</div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const counts = useQuery({
    queryKey: ["dash", "counts"],
    queryFn: async () => {
      const [pf, pr, init, rel] = await Promise.all([
        supabase.from("portfolios").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("initiatives").select("id", { count: "exact", head: true }),
        supabase.from("releases").select("id", { count: "exact", head: true }),
      ]);
      return {
        portfolios: pf.count ?? 0,
        products: pr.count ?? 0,
        initiatives: init.count ?? 0,
        releases: rel.count ?? 0,
      };
    },
  });

  const releases = useQuery({
    queryKey: ["dash", "releases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("releases")
        .select("id,name,status,target_date,released_at,product_id, products(name)")
        .order("target_date", { ascending: true })
        .limit(20);
      return data ?? [];
    },
  });

  const initiatives = useQuery({
    queryKey: ["dash", "initiatives"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("id,name,status,priority,target_date, initiative_types(label,color)")
        .order("priority", { ascending: true })
        .limit(8);
      return data ?? [];
    },
  });

  const upcoming = (releases.data ?? []).filter((r) => r.status !== "released");
  const released = (releases.data ?? []).filter((r) => r.status === "released");

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Portfolio overview & roadmap health" />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={Briefcase} label="Portfolios" value={counts.data?.portfolios ?? "—"} />
          <StatCard icon={Box} label="Products" value={counts.data?.products ?? "—"} />
          <StatCard icon={Lightbulb} label="Initiatives" value={counts.data?.initiatives ?? "—"} />
          <StatCard icon={Tag} label="Releases" value={counts.data?.releases ?? "—"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Upcoming releases</h3>
              </div>
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No upcoming releases.</p>
              ) : (
                <ul className="divide-y">
                  {upcoming.slice(0, 8).map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2">
                      <Link to="/releases/$id" params={{ id: r.id }} className="flex-1 truncate hover:underline">
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(r.products as { name?: string } | null)?.name ?? "No product"}
                        </div>
                      </Link>
                      <div className="ml-3 text-right">
                        <div className="text-xs text-muted-foreground">
                          {r.target_date ? format(new Date(r.target_date), "MMM d, yyyy") : "—"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recently released</h3>
              </div>
              {released.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nothing released yet.</p>
              ) : (
                <ul className="divide-y">
                  {released.slice(0, 8).map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2">
                      <div className="flex-1 truncate">
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(r.products as { name?: string } | null)?.name ?? "No product"}
                        </div>
                      </div>
                      <StatusBadge status="released" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Top initiatives</h3>
            </div>
            {(initiatives.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No initiatives yet.</p>
            ) : (
              <ul className="divide-y">
                {(initiatives.data ?? []).map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-2">
                    <Link to="/initiatives/$id" params={{ id: i.id }} className="flex-1 hover:underline">
                      <div className="text-sm font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(i.initiative_types as { label?: string } | null)?.label ?? "Other"}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={i.status as never} />
                      <span className="text-xs uppercase text-muted-foreground">{i.priority}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
