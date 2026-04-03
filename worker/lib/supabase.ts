import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function broadcastProgress(
  searchId: string,
  stage: string,
): Promise<void> {
  const channel = supabaseAdmin.channel(`search:${searchId}:progress`);
  await channel.send({
    type: "broadcast",
    event: "stage",
    payload: { stage, timestamp: new Date().toISOString() },
  });
  await supabaseAdmin.removeChannel(channel);
}
