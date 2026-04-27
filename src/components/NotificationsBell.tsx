import { Bell, Check } from "lucide-react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";

export function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const unread = (data ?? []).filter((n) => !n.read).length;

  async function markAll() {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  }
  async function markOne(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll} className="h-7 text-xs">
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {(data ?? []).length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No notifications</div>
          ) : (
            <ul className="divide-y">
              {(data ?? []).map((n) => (
                <li key={n.id} className={n.read ? "opacity-70" : "bg-accent/30"}>
                  <Link
                    to={n.link ?? "/"}
                    onClick={() => markOne(n.id)}
                    className="block px-3 py-2 hover:bg-accent"
                  >
                    <div className="text-sm font-medium">{n.title}</div>
                    {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
