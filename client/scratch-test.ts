import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  console.log("Calling get_dashboard_stats...");
  // Using the workspace_id from the previous output: b3341de4-ce3a-4519-a41c-fc6629becd50
  const { data, error } = await supabase.rpc('get_dashboard_stats', { workspace_uuid: 'b3341de4-ce3a-4519-a41c-fc6629becd50' });
  console.log("Error:", error);
  console.log("Keys:", data ? Object.keys(data) : null);
}

check();
