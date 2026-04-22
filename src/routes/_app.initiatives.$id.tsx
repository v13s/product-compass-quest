import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { format } from "date-fns";
import { CommentsPanel } from "@/components/CommentsPanel";

export const Route = createFileRoute("/_app/initiatives/$id")({
  component: InitiativeDetail,
});

function InitiativeDetail() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["initiative", id],
    queryFn: async () => {
      const { data: i } = await supabase
        .from("initiatives")
        .select("*, initiative_types(label,color,field_schema), initiative_products(product_id, products(name))")
        .eq("id", id)
        .single();
      return i;
    },
  });

  if (!data) return <PageHeader title="Loading…" />;
  const t = data.initiative_types as { label?: string; color?: string; field_schema?: { key: string; label: string }[] } | null;
  const cf = (data.custom_fields ?? {}) as Record<string, string>;
  const linked = (data.initiative_products as { products?: { name?: string } }[] | null) ?? [];

  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={t?.label}
      />
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={data.status as never} />
                    <PriorityBadge priority={data.priority as never} />
                    <span className="text-xs text-muted-foreground">
                      {data.target_date ? `Target ${format(new Date(data.target_date), "MMM d, yyyy")}` : "No target date"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {data.description || "No description."}
                  </p>
                  {(t?.field_schema ?? []).length > 0 && (
                    <div className="rounded-md border bg-muted/20 p-3">
                      <div className="mb-2 text-xs font-semibold text-muted-foreground">Type-specific fields</div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {(t!.field_schema ?? []).map((f) => (
                          <div key={f.key}>
                            <dt className="text-xs text-muted-foreground">{f.label}</dt>
                            <dd className="font-medium">{cf[f.key] || "—"}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 text-sm font-semibold">Linked products</h3>
                  {linked.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No linked products.</p>
                  ) : (
                    <ul className="space-y-2">
                      {linked.map((lp, idx) => (
                        <li key={idx} className="text-sm">{lp.products?.name}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="comments">
            <CommentsPanel entityType="initiative" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
