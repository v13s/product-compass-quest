import { supabase } from "@/integrations/supabase/client";

export async function notify(input: {
  user_id: string;
  title: string;
  body?: string;
  link?: string;
  entity_type?: string;
  entity_id?: string;
}) {
  await supabase.from("notifications").insert(input);
}

export async function notifyMany(users: string[], payload: Omit<Parameters<typeof notify>[0], "user_id">) {
  if (users.length === 0) return;
  await supabase.from("notifications").insert(users.map((u) => ({ user_id: u, ...payload })));
}
