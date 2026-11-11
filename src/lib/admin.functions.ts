import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ADMIN_EMAILS } from "./admin-data";

const CreateStaffSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["super_admin", "staff"]),
  permissions: z.array(z.string()).default([]),
  sessionToken: z.string().min(1, "Authentication token required"),
});

function getAdminClient() {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) {
    throw new Error("Supabase service role key is not configured on the server.");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const createStaffUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => CreateStaffSchema.parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();

    // 1. Authenticate the caller using their session token
    const {
      data: { user: caller },
      error: authErr,
    } = await adminClient.auth.getUser(data.sessionToken);

    if (authErr || !caller) {
      throw new Error("Unauthorized: Invalid administrator session.");
    }

    // 2. Check that the caller is a Super Administrator
    const callerEmail = caller.email?.toLowerCase();
    const isExplicit = !!callerEmail && ADMIN_EMAILS.some((e) => e.toLowerCase() === callerEmail);

    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isSuper = isExplicit || callerRoles?.some((r) => r.role === "super_admin");
    if (!isSuper) {
      throw new Error("Forbidden: Only a Super Administrator can provision new accounts.");
    }

    const cleanEmail = data.email.toLowerCase().trim();
    const cleanName = data.fullName.trim();

    // 3. Create the user in Supabase Auth via admin API
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        role: data.role,
      },
    });

    if (createError) {
      throw new Error(createError.message);
    }

    const newUserId = created.user.id;

    // 4. Ensure profile exists and is active
    await adminClient.from("profiles").upsert(
      {
        id: newUserId,
        email: cleanEmail,
        full_name: cleanName,
        is_active: true,
      },
      { onConflict: "id" },
    );

    // 5. Assign role
    await adminClient.from("user_roles").upsert(
      {
        user_id: newUserId,
        role: data.role,
      },
      { onConflict: "user_id,role" },
    );

    // 6. Assign permissions if role === "staff"
    if (data.role === "staff" && data.permissions.length > 0) {
      const inserts = data.permissions.map((p) => ({
        user_id: newUserId,
        permission: p as Database["public"]["Enums"]["app_permission"],
      }));
      await adminClient.from("staff_permissions").insert(inserts);
    }

    // 7. Record activity in activity logs
    try {
      await adminClient.from("activity_logs").insert({
        actor_id: caller.id,
        actor_name: caller.user_metadata?.["full_name"] || caller.email || "Super Administrator",
        action: "create_user",
        entity_type: "staff",
        entity_id: newUserId,
        summary: `Created ${data.role === "super_admin" ? "Super Admin" : "Staff"} account for ${cleanName} (${cleanEmail})`,
        details: {
          email: cleanEmail,
          full_name: cleanName,
          role: data.role,
          permissions: data.role === "super_admin" ? "all" : data.permissions,
        },
      });
    } catch (logErr) {
      console.error("Failed to write to activity logs:", logErr);
    }

    return {
      success: true,
      userId: newUserId,
      email: cleanEmail,
      fullName: cleanName,
    };
  });
