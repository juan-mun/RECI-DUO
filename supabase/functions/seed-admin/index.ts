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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const adminEmail = "andres.moreno04@usa.edu.co";
    const adminPassword = "123456789";

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find((u) => u.email === adminEmail);

    if (existingAdmin) {
      // Ensure role exists
      const { data: roleExists } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", existingAdmin.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleExists) {
        await supabaseAdmin.from("user_roles").insert({ user_id: existingAdmin.id, role: "admin" });
      }

      return new Response(JSON.stringify({ message: "Admin already exists", user_id: existingAdmin.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (createError) throw createError;

    // Assign admin role
    await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

    // Create profile
    await supabaseAdmin.from("profiles").insert({
      user_id: newUser.user.id,
      razon_social: "RECI-DUO Administración",
      nit: "000.000.000-0",
      representante_legal: "Andrés Moreno",
      email_corporativo: adminEmail,
      telefono: "+57 000 000 0000",
      ciudad: "Bogotá",
    });

    return new Response(JSON.stringify({ message: "Admin created", user_id: newUser.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
