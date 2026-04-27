import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { STATUSES, STATUS_LABEL, type WorkStatus } from "@/lib/constants";
import { PriorityBadge } from "@/components/PriorityBadge";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/kanban")({
  component: KanbanPage,
});

const COLUMNS: WorkStatus[] = ["planned", "in_progress", "in_review", "done", "released"];
type Entity = "story" | "task" | "epic";

function KanbanPage() {
  const [entity, setEntity] = useState<Entity>("story");
  const [productFilter, setProductFilter] = useState<string>("all");
  const { canEdit } = useAuth();
  const qc = useQueryClient();

  const products = useQuery({
    queryKey: ["k-products"],
    queryFn: async () => (await supabase.from("products").select("id,name").order("name")).data ?? [],
  });

  const items = useQuery({
    queryKey: ["kanban", entity, productFilter],
    queryFn: async () => {
      if (entity === "epic") {
        let q = supabase.from("epics").select("id,name,status,priority,product_id,target_date,owner_id");
        if (productFilter !== "all") q = q.eq("product_id", productFilter);
        return (await q).data ?? [];
      }
      if (entity === "story") {
        const { data } = await supabase
          .from("stories")
          .select("id,name,status,priority,target_date,assignee_id,epic_id, epics!inner(product_id)");
        return (data ?? []).filter((s) =>
          productFilter === "all" || (s.epics as { product_id: string } | null)?.product_id === productFilter,
        );
      }
      const { data } = await supabase
        .from("tasks")
        .select("id,name,status,priority,target_date,assignee_id,story_id, stories!inner(epic_id, epics!inner(product_id))");
      return (data ?? []).filter((t) =>
        productFilter === "all" ||
        ((t.stories as { epics: { product_id: string } | null } | null)?.epics?.product_id === productFilter),
      );
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function onDragEnd(e: DragEndEvent) {
    if (!canEdit) return;
    const id = e.active.id as string;
    const newStatus = e.over?.id as WorkStatus | undefined;
    if (!newStatus) return;
    const table = entity === "epic" ? "epics" : entity === "story" ? "stories" : "tasks";
    const { error } = await supabase.from(table).update({ status: newStatus }).eq("id", id);
    if (error) toast.error("Update failed", { description: error.message });
    else {
      toast.success(`Moved to ${STATUS_LABEL[newStatus]}`);
      qc.invalidateQueries({ queryKey: ["kanban"] });
    }
  }

  return (
    <>
      <PageHeader
        title="Kanban"
        subtitle="Drag cards between columns to update status."
        actions={
          <div className="flex items-center gap-2">
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {(products.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={entity} onValueChange={(v) => setEntity(v as Entity)}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="epic">Epics</SelectItem>
                <SelectItem value="story">Stories</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="p-6">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((col) => {
              const colItems = (items.data ?? []).filter((i) => i.status === col);
              return <Column key={col} status={col} count={colItems.length}>
                {colItems.map((it) => (
                  <KCard key={it.id} entity={entity} item={it as KItem} />
                ))}
              </Column>;
            })}
          </div>
        </DndContext>
      </div>
    </>
  );
}

type KItem = {
  id: string;
  name: string;
  status: WorkStatus;
  priority: "p0" | "p1" | "p2" | "p3";
  target_date: string | null;
};

function Column({ status, count, children }: { status: WorkStatus; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <Card ref={setNodeRef} className={isOver ? "ring-2 ring-primary" : ""}>
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase text-muted-foreground">{STATUS_LABEL[status]}</div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{count}</span>
        </div>
        <div className="flex min-h-[120px] flex-col gap-2">{children}</div>
      </CardContent>
    </Card>
  );
}

function KCard({ entity, item }: { entity: Entity; item: KItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const link = entity === "epic" ? `/epics/${item.id}` : entity === "story" ? `/stories/${item.id}` : `/stories/${(item as KItem & { story_id?: string }).story_id ?? ""}`;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, opacity: isDragging ? 0.5 : 1 }}
      className="cursor-grab rounded-md border bg-card p-2 text-sm shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <Link to={link} onPointerDown={(e) => e.stopPropagation()} className="line-clamp-2 font-medium hover:underline">
          {item.name}
        </Link>
        <PriorityBadge priority={item.priority} />
      </div>
      {item.target_date && (
        <div className="mt-1 text-[11px] text-muted-foreground">Due {format(new Date(item.target_date), "MMM d")}</div>
      )}
    </div>
  );
}
