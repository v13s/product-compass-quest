import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useRef } from "react";
import {
  addDays, addMonths, addQuarters, addYears, differenceInDays, format,
  startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfWeek, endOfMonth, endOfQuarter, endOfYear,
} from "date-fns";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { detectShift, fmtDelta } from "@/lib/timeline";

export const Route = createFileRoute("/_app/roadmap")({
  component: RoadmapPage,
});

type Granularity = "week" | "month" | "quarter" | "year";

function RoadmapPage() {
  const [granularity, setGranularity] = useState<Granularity>("quarter");
  const [productFilter, setProductFilter] = useState<string>("all");
  const { canEdit } = useAuth();
  const qc = useQueryClient();

  const products = useQuery({
    queryKey: ["roadmap", "products"],
    queryFn: async () => (await supabase.from("products").select("id,name").order("name")).data ?? [],
  });

  const initiatives = useQuery({
    queryKey: ["roadmap", "initiatives"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("id,name,start_date,target_date,status, initiative_types(label,color), initiative_products(product_id)");
      return data ?? [];
    },
  });

  const epics = useQuery({
    queryKey: ["roadmap", "epics"],
    queryFn: async () => (await supabase.from("epics").select("id,name,product_id,start_date,target_date,status,priority")).data ?? [],
  });

  const releases = useQuery({
    queryKey: ["roadmap", "releases"],
    queryFn: async () => (await supabase.from("releases").select("id,name,product_id,target_date,status")).data ?? [],
  });

  const range = useMemo(() => {
    const today = new Date();
    if (granularity === "week") return { start: startOfWeek(addDays(today, -14)), end: endOfWeek(addDays(today, 56)) };
    if (granularity === "month") return { start: startOfMonth(addMonths(today, -1)), end: endOfMonth(addMonths(today, 5)) };
    if (granularity === "quarter") return { start: startOfQuarter(addQuarters(today, -1)), end: endOfQuarter(addQuarters(today, 3)) };
    return { start: startOfYear(addYears(today, -1)), end: endOfYear(addYears(today, 2)) };
  }, [granularity]);

  const totalDays = differenceInDays(range.end, range.start) || 1;

  const ticks = useMemo(() => {
    const out: { date: Date; label: string }[] = [];
    let cur = range.start;
    while (cur <= range.end) {
      out.push({ date: cur, label: tickLabel(cur, granularity) });
      if (granularity === "week") cur = addDays(cur, 7);
      else if (granularity === "month") cur = addMonths(cur, 1);
      else if (granularity === "quarter") cur = addQuarters(cur, 1);
      else cur = addYears(cur, 1);
    }
    return out;
  }, [range, granularity]);

  function pct(d: Date) {
    return (differenceInDays(d, range.start) / totalDays) * 100;
  }
  function clampPct(p: number) {
    return Math.max(0, Math.min(100, p));
  }

  const filteredProducts = (products.data ?? []).filter((p) => productFilter === "all" || p.id === productFilter);

  type Band = {
    id: string;
    kind: "epic" | "initiative";
    rawId: string;
    link: string;
    label: string;
    start: string | null;
    end: string | null;
    color: string;
  };

  function bandsForProduct(productId: string): Band[] {
    const productEpics = (epics.data ?? []).filter((e) => e.product_id === productId);
    const productInits = (initiatives.data ?? []).filter((i) =>
      (i.initiative_products as { product_id: string }[] | null)?.some((ip) => ip.product_id === productId),
    );
    return [
      ...productInits.map((i) => ({
        id: `i-${i.id}`,
        kind: "initiative" as const,
        rawId: i.id,
        link: `/initiatives/${i.id}`,
        label: i.name,
        start: i.start_date ?? i.target_date,
        end: i.target_date,
        color: (i.initiative_types as { color?: string } | null)?.color ?? "#6366f1",
      })),
      ...productEpics.map((e) => ({
        id: `e-${e.id}`,
        kind: "epic" as const,
        rawId: e.id,
        link: `/epics/${e.id}`,
        label: e.name,
        start: e.start_date ?? e.target_date,
        end: e.target_date,
        color: "#0ea5e9",
      })),
    ];
  }

  // ---- Drag state ----
  const dragRef = useRef<{
    band: Band;
    laneEl: HTMLDivElement;
    laneWidth: number;
    startX: number;
    spanDays: number;
    origStart: Date;
    origEnd: Date;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ id: string; left: number; width: number } | null>(null);

  function onBandPointerDown(e: React.PointerEvent, band: Band, laneEl: HTMLDivElement) {
    if (!canEdit || !band.start || !band.end) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    const origStart = new Date(band.start);
    const origEnd = new Date(band.end);
    dragRef.current = {
      band,
      laneEl,
      laneWidth: laneEl.getBoundingClientRect().width,
      startX: e.clientX,
      spanDays: Math.max(1, differenceInDays(origEnd, origStart)),
      origStart,
      origEnd,
    };
  }
  function onBandPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dxPx = e.clientX - d.startX;
    const dxDays = Math.round((dxPx / d.laneWidth) * totalDays);
    const newStart = addDays(d.origStart, dxDays);
    const left = clampPct(pct(newStart));
    const right = clampPct(pct(addDays(newStart, d.spanDays)));
    setDragPreview({ id: d.band.id, left, width: Math.max(1.5, right - left) });
  }
  async function onBandPointerUp(e: React.PointerEvent) {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const dxPx = e.clientX - d.startX;
    const dxDays = Math.round((dxPx / d.laneWidth) * totalDays);
    setDragPreview(null);
    if (dxDays === 0) return;

    const newStart = addDays(d.origStart, dxDays);
    const newEnd = addDays(d.origEnd, dxDays);
    const newStartStr = format(newStart, "yyyy-MM-dd");
    const newEndStr = format(newEnd, "yyyy-MM-dd");

    const table = d.band.kind === "epic" ? "epics" : "initiatives";
    const { error } = await supabase
      .from(table)
      .update({ start_date: newStartStr, target_date: newEndStr })
      .eq("id", d.band.rawId);

    if (error) {
      toast.error("Failed to reschedule", { description: error.message });
      return;
    }

    const shift = detectShift({
      oldStart: d.band.start,
      oldEnd: d.band.end,
      newStart: newStartStr,
      newEnd: newEndStr,
    });
    if (shift.shifted) {
      toast.warning("Timeline shifted", {
        description: `${d.band.label}: start ${fmtDelta(shift.startDelta)}, end ${fmtDelta(shift.endDelta)}.`,
      });
    } else {
      toast.success("Rescheduled");
    }
    qc.invalidateQueries({ queryKey: ["roadmap"] });
  }

  return (
    <>
      <PageHeader
        title="Roadmap"
        subtitle={canEdit ? "Drag bars to reschedule. Timeline shifts will be flagged." : "Read-only view."}
        actions={
          <div className="flex items-center gap-2">
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {(products.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid border-b" style={{ gridTemplateColumns: "200px 1fr" }}>
                  <div className="border-r bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">Product</div>
                  <div className="relative h-9">
                    {ticks.map((t, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l text-[10px] text-muted-foreground"
                        style={{ left: `${pct(t.date)}%` }}
                      >
                        <span className="ml-1">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {filteredProducts.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No products yet. Create a product to start your roadmap.
                  </div>
                )}
                {filteredProducts.map((p) => {
                  const bands = bandsForProduct(p.id);
                  const productReleases = (releases.data ?? []).filter((r) => r.product_id === p.id && r.target_date);
                  return (
                    <div key={p.id} className="grid border-b" style={{ gridTemplateColumns: "200px 1fr" }}>
                      <div className="border-r p-3">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {bands.length} item{bands.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div
                        className="relative"
                        style={{ minHeight: Math.max(60, bands.length * 28 + 16) }}
                        ref={(el) => {
                          if (el) (el as HTMLDivElement).dataset.lane = p.id;
                        }}
                      >
                        {productReleases.map((r) => (
                          <div
                            key={r.id}
                            className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary/60"
                            style={{ left: `${clampPct(pct(new Date(r.target_date!)))}%` }}
                            title={r.name}
                          >
                            <span className="absolute -top-0.5 -translate-x-1/2 rounded-sm bg-primary px-1 py-0.5 text-[9px] font-medium text-primary-foreground">
                              {r.name}
                            </span>
                          </div>
                        ))}
                        {bands.map((b, idx) => {
                          if (!b.start && !b.end) return null;
                          const start = b.start ? new Date(b.start) : new Date(b.end!);
                          const end = b.end ? new Date(b.end) : new Date(b.start!);
                          const left = clampPct(pct(start));
                          const right = clampPct(pct(end));
                          const width = Math.max(1.5, right - left);
                          const preview = dragPreview?.id === b.id ? dragPreview : null;
                          return (
                            <div
                              key={b.id}
                              className="absolute"
                              style={{
                                left: `${preview ? preview.left : left}%`,
                                width: `${preview ? preview.width : width}%`,
                                top: 8 + idx * 28,
                                height: 22,
                              }}
                            >
                              <div
                                role="button"
                                onPointerDown={(e) => {
                                  const lane = (e.currentTarget.parentElement?.parentElement) as HTMLDivElement;
                                  if (lane) onBandPointerDown(e, b, lane);
                                }}
                                onPointerMove={onBandPointerMove}
                                onPointerUp={onBandPointerUp}
                                className={`flex h-full items-center rounded-md border px-2 text-[11px] font-medium text-white shadow-sm transition-transform hover:scale-[1.01] ${canEdit && b.start && b.end ? "cursor-grab active:cursor-grabbing" : ""}`}
                                style={{ backgroundColor: b.color, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                                title={b.label}
                              >
                                <Link
                                  to={b.link}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="block w-full truncate text-white"
                                >
                                  {b.label}
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary"></span> Release marker</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#0ea5e9" }}></span> Epic</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#6366f1" }}></span> Initiative</span>
        </div>
      </div>
    </>
  );
}

function tickLabel(d: Date, g: Granularity) {
  if (g === "week") return format(d, "MMM d");
  if (g === "month") return format(d, "MMM");
  if (g === "quarter") return `Q${Math.floor(d.getMonth() / 3) + 1} ${format(d, "yy")}`;
  return format(d, "yyyy");
}
