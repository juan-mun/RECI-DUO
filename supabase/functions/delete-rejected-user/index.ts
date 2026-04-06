import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!callerRole) throw new Error("Not authorized");

    const { request_id } = await req.json();
    if (!request_id) throw new Error("request_id required");

    // Get request to find user_id
    const { data: request } = await supabaseAdmin
      .from("registration_requests")
      .select("user_id, status")
      .eq("id", request_id)
      .single();
    if (!request) throw new Error("Request not found");
    if (request.status !== "rechazada") throw new Error("Request is not rejected");

    const userId = request.user_id;

    // Delete storage files for this request
    const { data: docs } = await supabaseAdmin
      .from("registration_documents")
      .select("file_path")
      .eq("request_id", request_id);
    if (docs && docs.length > 0) {
      const paths = docs.map((d) => d.file_path);
      await supabaseAdmin.storage.from("registration-documents").remove(paths);
    }

    // Delete registration_documents
    await supabaseAdmin.from("registration_documents").delete().eq("request_id", request_id);

    // Delete action logs
    await supabaseAdmin.from("request_actions_log").delete().eq("request_id", request_id);

    // Delete registration request
    await supabaseAdmin.from("registration_requests").delete().eq("id", request_id);

    // Delete profile
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    // Delete user roles (if any)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    // Delete auth user (this is the key step to free the email)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
