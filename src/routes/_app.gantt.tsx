import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  addDays, addMonths, differenceInDays, format, startOfMonth, endOfMonth,
} from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/gantt")({
  component: GanttPage,
});

type Row = {
  id: string;
  kind: "epic" | "story" | "task";
  link: string;
  label: string;
  start: Date;
  end: Date;
  color: string;
};

function GanttPage() {
  const [productFilter, setProductFilter] = useState<string>("all");

  const products = useQuery({
    queryKey: ["g-products"],
    queryFn: async () => (await supabase.from("products").select("id,name").order("name")).data ?? [],
  });
  const epics = useQuery({
    queryKey: ["g-epics"],
    queryFn: async () => (await supabase.from("epics").select("id,name,product_id,start_date,target_date")).data ?? [],
  });
  const stories = useQuery({
    queryKey: ["g-stories"],
    queryFn: async () => (await supabase.from("stories").select("id,name,start_date,target_date,epic_id, epics!inner(product_id)")).data ?? [],
  });
  const tasks = useQuery({
    queryKey: ["g-tasks"],
    queryFn: async () => (await supabase.from("tasks").select("id,name,start_date,target_date,story_id, stories!inner(epic_id, epics!inner(product_id))")).data ?? [],
  });
  const deps = useQuery({
    queryKey: ["g-deps"],
    queryFn: async () => (await supabase.from("dependencies").select("*")).data ?? [],
  });

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    (epics.data ?? []).forEach((e) => {
      if (productFilter !== "all" && e.product_id !== productFilter) return;
      if (!e.start_date && !e.target_date) return;
      out.push({
        id: `epic:${e.id}`,
        kind: "epic",
        link: `/epics/${e.id}`,
        label: e.name,
        start: new Date(e.start_date ?? e.target_date!),
        end: new Date(e.target_date ?? e.start_date!),
        color: "#0ea5e9",
      });
    });
    (stories.data ?? []).forEach((s) => {
      const pid = (s.epics as { product_id: string } | null)?.product_id;
      if (productFilter !== "all" && pid !== productFilter) return;
      if (!s.start_date && !s.target_date) return;
      out.push({
        id: `story:${s.id}`,
        kind: "story",
        link: `/stories/${s.id}`,
        label: s.name,
        start: new Date(s.start_date ?? s.target_date!),
        end: new Date(s.target_date ?? s.start_date!),
        color: "#10b981",
      });
    });
    (tasks.data ?? []).forEach((t) => {
      const pid = ((t.stories as { epics: { product_id: string } | null } | null)?.epics)?.product_id;
      if (productFilter !== "all" && pid !== productFilter) return;
      if (!t.start_date && !t.target_date) return;
      out.push({
        id: `task:${t.id}`,
        kind: "task",
        link: "/my-work",
        label: t.name,
        start: new Date(t.start_date ?? t.target_date!),
        end: new Date(t.target_date ?? t.start_date!),
        color: "#f59e0b",
      });
    });
    return out;
  }, [epics.data, stories.data, tasks.data, productFilter]);

  const range = useMemo(() => {
    if (rows.length === 0) {
      const today = new Date();
      return { start: startOfMonth(today), end: endOfMonth(addMonths(today, 2)) };
    }
    let min = rows[0].start;
    let max = rows[0].end;
    rows.forEach((r) => {
      if (r.start < min) min = r.start;
      if (r.end > max) max = r.end;
    });
    return { start: addDays(min, -7), end: addDays(max, 7) };
  }, [rows]);

  const totalDays = Math.max(1, differenceInDays(range.end, range.start));
  const dayWidth = 18;
  const labelWidth = 240;
  const rowHeight = 30;
  const chartWidth = totalDays * dayWidth;

  function xFor(d: Date) {
    return differenceInDays(d, range.start) * dayWidth;
  }

  // Build month ticks
  const months: { x: number; label: string }[] = [];
  let cur = startOfMonth(range.start);
  while (cur <= range.end) {
    months.push({ x: xFor(cur), label: format(cur, "MMM yyyy") });
    cur = addMonths(cur, 1);
  }

  const indexById = new Map(rows.map((r, i) => [r.id, i]));

  function depKey(type: string, id: string) {
    return `${type}:${id}`;
  }

  // Map only "blocks" deps; arrow goes from end-of-source to start-of-target
  const arrows = (deps.data ?? [])
    .filter((d) => d.dep_type === "blocks")
    .map((d) => {
      const fromIdx = indexById.get(depKey(d.from_type, d.from_id));
      const toIdx = indexById.get(depKey(d.to_type, d.to_id));
      if (fromIdx === undefined || toIdx === undefined) return null;
      const from = rows[fromIdx];
      const to = rows[toIdx];
      const x1 = xFor(from.end) + dayWidth;
      const y1 = fromIdx * rowHeight + rowHeight / 2;
      const x2 = xFor(to.start);
      const y2 = toIdx * rowHeight + rowHeight / 2;
      return { id: d.id, x1, y1, x2, y2 };
    })
    .filter(Boolean) as { id: string; x1: number; y1: number; x2: number; y2: number }[];

  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <PageHeader
        title="Gantt"
        subtitle="Timeline with blocking dependencies (arrows). Add dependencies on epic/story detail pages."
        actions={
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {(products.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No items with dates yet.
              </div>
            ) : (
              <div className="flex">
                <div className="border-r" style={{ width: labelWidth }}>
                  <div className="h-9 border-b bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
                    Item
                  </div>
                  {rows.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center border-b px-3 text-xs"
                      style={{ height: rowHeight }}
                    >
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: r.color }} />
                      <Link to={r.link} className="truncate hover:underline" title={r.label}>
                        {r.label}
                      </Link>
                    </div>
                  ))}
                </div>
                <div ref={scrollRef} className="flex-1 overflow-x-auto">
                  <div style={{ width: chartWidth, position: "relative" }}>
                    <div className="relative h-9 border-b bg-muted/30">
                      {months.map((m, i) => (
                        <div
                          key={i}
                          className="absolute top-0 h-full border-l px-1 text-[10px] text-muted-foreground"
                          style={{ left: m.x }}
                        >
                          {m.label}
                        </div>
                      ))}
                    </div>
                    <div className="relative" style={{ height: rows.length * rowHeight }}>
                      {/* Today line */}
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 w-px bg-destructive/70"
                        style={{ left: xFor(new Date()) }}
                        title="Today"
                      />
                      {rows.map((r, i) => {
                        const left = xFor(r.start);
                        const width = Math.max(dayWidth, (differenceInDays(r.end, r.start) + 1) * dayWidth);
                        return (
                          <Link
                            key={r.id}
                            to={r.link}
                            className="absolute rounded-md border px-2 text-[11px] font-medium text-white shadow-sm"
                            style={{
                              left,
                              width,
                              top: i * rowHeight + 5,
                              height: rowHeight - 10,
                              lineHeight: `${rowHeight - 10}px`,
                              backgroundColor: r.color,
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            }}
                            title={`${r.label} — ${format(r.start, "MMM d")} → ${format(r.end, "MMM d")}`}
                          >
                            {r.label}
                          </Link>
                        );
                      })}
                      {/* Dependency arrows */}
                      <svg
                        className="pointer-events-none absolute inset-0"
                        width={chartWidth}
                        height={rows.length * rowHeight}
                      >
                        <defs>
                          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--destructive))" />
                          </marker>
                        </defs>
                        {arrows.map((a) => {
                          const midX = a.x1 + 8;
                          const path = `M ${a.x1} ${a.y1} L ${midX} ${a.y1} L ${midX} ${a.y2} L ${a.x2} ${a.y2}`;
                          return (
                            <path
                              key={a.id}
                              d={path}
                              fill="none"
                              stroke="hsl(var(--destructive))"
                              strokeWidth={1.5}
                              markerEnd="url(#arrow)"
                              opacity={0.8}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#0ea5e9" }} /> Epic</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#10b981" }} /> Story</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#f59e0b" }} /> Task</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-px bg-destructive" /> Blocks</span>
          <span className="ml-auto text-[10px]">scrollLeft: {scrollLeft}</span>
        </div>
      </div>
    </>
  );
}
