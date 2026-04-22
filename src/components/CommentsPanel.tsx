import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function CommentsPanel({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const comments = useQuery({
    queryKey: ["comments", entityType, entityId],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id,body,created_at,author_id, profiles:author_id(full_name,avatar_url)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("comments")
        .insert({ entity_type: entityType, entity_id: entityId, body, author_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
          />
          <div className="flex justify-end">
            <Button size="sm" disabled={!body.trim() || add.isPending} onClick={() => add.mutate()}>
              Post
            </Button>
          </div>
        </div>
        <div className="divide-y">
          {(comments.data ?? []).map((c) => {
            const p = c.profiles as { full_name?: string } | null;
            const name = p?.full_name || "User";
            return (
              <div key={c.id} className="flex gap-3 py-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground">{name}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
              </div>
            );
          })}
          {(comments.data ?? []).length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Be the first to comment.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
