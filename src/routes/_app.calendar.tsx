import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  format, isSameMonth, isSameDay, parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
});

type EventItem = {
  id: string;
  kind: "release" | "epic" | "story" | "task" | "initiative";
  date: Date;
  label: string;
  link: string;
  color: string;
};

function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());

  const releases = useQuery({
    queryKey: ["cal-releases"],
    queryFn: async () => (await supabase.from("releases").select("id,name,target_date")).data ?? [],
  });
  const epics = useQuery({
    queryKey: ["cal-epics"],
    queryFn: async () => (await supabase.from("epics").select("id,name,target_date")).data ?? [],
  });
  const stories = useQuery({
    queryKey: ["cal-stories"],
    queryFn: async () => (await supabase.from("stories").select("id,name,target_date")).data ?? [],
  });
  const tasks = useQuery({
    queryKey: ["cal-tasks"],
    queryFn: async () => (await supabase.from("tasks").select("id,name,target_date")).data ?? [],
  });
  const initiatives = useQuery({
    queryKey: ["cal-initiatives"],
    queryFn: async () => (await supabase.from("initiatives").select("id,name,target_date")).data ?? [],
  });

  const events: EventItem[] = useMemo(() => {
    const out: EventItem[] = [];
    (releases.data ?? []).forEach((r) => r.target_date && out.push({ id: `r-${r.id}`, kind: "release", date: parseISO(r.target_date), label: r.name, link: `/releases/${r.id}`, color: "hsl(var(--primary))" }));
    (epics.data ?? []).forEach((r) => r.target_date && out.push({ id: `e-${r.id}`, kind: "epic", date: parseISO(r.target_date), label: r.name, link: `/epics/${r.id}`, color: "#0ea5e9" }));
    (stories.data ?? []).forEach((r) => r.target_date && out.push({ id: `s-${r.id}`, kind: "story", date: parseISO(r.target_date), label: r.name, link: `/stories/${r.id}`, color: "#10b981" }));
    (tasks.data ?? []).forEach((r) => r.target_date && out.push({ id: `t-${r.id}`, kind: "task", date: parseISO(r.target_date), label: r.name, link: "/my-work", color: "#f59e0b" }));
    (initiatives.data ?? []).forEach((r) => r.target_date && out.push({ id: `i-${r.id}`, kind: "initiative", date: parseISO(r.target_date), label: r.name, link: `/initiatives/${r.id}`, color: "#6366f1" }));
    return out;
  }, [releases.data, epics.data, stories.data, tasks.data, initiatives.data]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="All due-dates across releases, epics, stories, tasks and initiatives."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center text-sm font-semibold">{format(cursor, "MMMM yyyy")}</div>
            <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          </div>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b text-xs font-semibold text-muted-foreground">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="p-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                const dayEvents = events.filter((e) => isSameDay(e.date, d));
                const inMonth = isSameMonth(d, cursor);
                const today = isSameDay(d, new Date());
                return (
                  <div
                    key={i}
                    className={`min-h-[110px] border-b border-r p-1.5 text-xs ${inMonth ? "" : "bg-muted/30 text-muted-foreground"}`}
                  >
                    <div className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${today ? "bg-primary text-primary-foreground" : ""}`}>
                      {format(d, "d")}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 4).map((ev) => (
                        <Link
                          key={ev.id}
                          to={ev.link}
                          className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: ev.color }}
                          title={`${ev.kind}: ${ev.label}`}
                        >
                          {ev.label}
                        </Link>
                      ))}
                      {dayEvents.length > 4 && (
                        <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 4} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
