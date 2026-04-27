import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

type EntityType = "epic" | "story" | "task" | "initiative";

export function DependenciesPanel({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const [targetType, setTargetType] = useState<EntityType>("epic");
  const [targetId, setTargetId] = useState("");
  const [depType, setDepType] = useState<"blocks" | "relates_to" | "duplicates">("blocks");

  const { data: deps } = useQuery({
    queryKey: ["deps", entityType, entityId],
    queryFn: async () => {
      const { data } = await supabase
        .from("dependencies")
        .select("*")
        .or(`and(from_type.eq.${entityType},from_id.eq.${entityId}),and(to_type.eq.${entityType},to_id.eq.${entityId})`);
      return data ?? [];
    },
  });

  async function add() {
    if (!targetId) {
      toast.error("Enter a target ID");
      return;
    }
    const { error } = await supabase.from("dependencies").insert({
      from_type: entityType,
      from_id: entityId,
      to_type: targetType,
      to_id: targetId,
      dep_type: depType,
    });
    if (error) toast.error("Failed to add", { description: error.message });
    else {
      toast.success("Dependency added");
      setTargetId("");
      qc.invalidateQueries({ queryKey: ["deps", entityType, entityId] });
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("dependencies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["deps", entityType, entityId] });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Link2 className="h-4 w-4" /> Dependencies
        </div>
        {(deps ?? []).length === 0 && (
          <div className="text-xs text-muted-foreground">No dependencies yet.</div>
        )}
        <ul className="space-y-1.5">
          {(deps ?? []).map((d) => {
            const outgoing = d.from_type === entityType && d.from_id === entityId;
            const otherType = outgoing ? d.to_type : d.from_type;
            const otherId = outgoing ? d.to_id : d.from_id;
            return (
              <li key={d.id} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                <div>
                  <span className="font-medium">{outgoing ? "→" : "←"} {d.dep_type}</span>{" "}
                  <span className="text-muted-foreground">{otherType}</span>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{otherId.slice(0, 8)}</code>
                </div>
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(d.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {canEdit && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <Select value={depType} onValueChange={(v) => setDepType(v as typeof depType)}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blocks">blocks</SelectItem>
                <SelectItem value="relates_to">relates to</SelectItem>
                <SelectItem value="duplicates">duplicates</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as EntityType)}>
              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="epic">epic</SelectItem>
                <SelectItem value="story">story</SelectItem>
                <SelectItem value="task">task</SelectItem>
                <SelectItem value="initiative">initiative</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="h-8 flex-1 min-w-[200px] font-mono text-xs"
              placeholder="Target UUID"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
            <Button size="sm" onClick={add}>Add</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
