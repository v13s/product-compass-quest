import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_app/portfolios/$id")({
  component: PortfolioDetail,
});

function PortfolioDetail() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["portfolio", id],
    queryFn: async () => {
      const [{ data: pf }, { data: products }, { data: initiatives }] = await Promise.all([
        supabase.from("portfolios").select("*").eq("id", id).single(),
        supabase.from("products").select("id,name,status,priority,target_date").eq("portfolio_id", id),
        supabase.from("initiatives").select("id,name,status,priority,target_date, initiative_types(label)").eq("portfolio_id", id),
      ]);
      return { pf, products: products ?? [], initiatives: initiatives ?? [] };
    },
  });

  if (!data?.pf) return <PageHeader title="Loading…" />;
  return (
    <>
      <PageHeader title={data.pf.name} subtitle={data.pf.description ?? undefined} />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Products</h3>
            <ul className="divide-y">
              {data.products.map((p) => (
                <li key={p.id} className="py-2">
                  <Link to="/products/$id" params={{ id: p.id }} className="text-sm hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
              {data.products.length === 0 && <p className="text-sm text-muted-foreground">No products.</p>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Initiatives</h3>
            <ul className="divide-y">
              {data.initiatives.map((i) => (
                <li key={i.id} className="py-2">
                  <Link to="/initiatives/$id" params={{ id: i.id }} className="text-sm hover:underline">
                    {i.name}
                  </Link>
                </li>
              ))}
              {data.initiatives.length === 0 && <p className="text-sm text-muted-foreground">No initiatives.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
