import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { RELEASE_STATUS_LABEL } from "@/lib/constants";
import { CommentsPanel } from "@/components/CommentsPanel";

export const Route = createFileRoute("/_app/releases/$id")({
  component: ReleaseDetail,
});

function ReleaseDetail() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["release", id],
    queryFn: async () => {
      const { data: r } = await supabase
        .from("releases")
        .select("*, products(name), release_epics(epic_id, epics(id,name,status))")
        .eq("id", id)
        .single();
      const { data: stories } = await supabase
        .from("stories")
        .select("id,name,status,priority")
        .eq("release_id", id);
      return { r, stories: stories ?? [] };
    },
  });

  if (!data?.r) return <PageHeader title="Loading…" />;
  const epics = (data.r.release_epics as { epics?: { id: string; name: string; status: string } }[] | null) ?? [];

  return (
    <>
      <PageHeader
        title={data.r.name}
        subtitle={`${RELEASE_STATUS_LABEL[data.r.status as never]} • ${
          data.r.target_date ? format(new Date(data.r.target_date), "MMM d, yyyy") : "no target"
        }`}
      />
      <div className="p-6">
        <Tabs defaultValue="scope">
          <TabsList>
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="scope">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card><CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold">Epics in scope</h3>
                {epics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No epics linked to this release.</p>
                ) : (
                  <ul className="divide-y">
                    {epics.map((e, i) => e.epics && (
                      <li key={i} className="py-2">
                        <Link to="/epics/$id" params={{ id: e.epics.id }} className="text-sm hover:underline">
                          {e.epics.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold">Stories cherry-picked into this release</h3>
                {data.stories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stories yet.</p>
                ) : (
                  <ul className="divide-y">
                    {data.stories.map((s) => (
                      <li key={s.id} className="py-2 text-sm">{s.name}</li>
                    ))}
                  </ul>
                )}
              </CardContent></Card>
            </div>
          </TabsContent>
          <TabsContent value="overview">
            <Card><CardContent className="p-4">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {data.r.description || "No description."}
              </p>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="comments">
            <CommentsPanel entityType="release" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
