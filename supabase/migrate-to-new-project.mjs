// supabase/migrate-to-new-project.mjs
// Run: node supabase/migrate-to-new-project.mjs
//
// This script imports data from data_backup.json into your NEW Supabase project.
// Before running:
//   1. Create a new Supabase project at https://supabase.com/dashboard
//   2. Run the schema SQL (0000_ahaban_core_schema.sql + 0001_vehicle_photos_storage_policies.sql)
//      in the new project's SQL Editor
//   3. Set the two env vars below to point at the NEW project

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ──── CONFIGURE THESE for your NEW Supabase project ────
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL;
const NEW_SERVICE_ROLE_KEY = process.env.NEW_SERVICE_ROLE_KEY;
// ────────────────────────────────────────────────────────

if (!NEW_SUPABASE_URL || !NEW_SERVICE_ROLE_KEY) {
  console.error(
    "Error: Set NEW_SUPABASE_URL and NEW_SERVICE_ROLE_KEY environment variables.\n" +
      "Example:\n" +
      '  set NEW_SUPABASE_URL=https://xxxx.supabase.co\n' +
      '  set NEW_SERVICE_ROLE_KEY=eyJ...\n' +
      "  node supabase/migrate-to-new-project.mjs"
  );
  process.exit(1);
}

// Use service_role key to bypass RLS
const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const backup = JSON.parse(readFileSync("supabase/data_backup.json", "utf-8"));

async function migrate() {
  console.log("🚀 Starting migration to new Supabase project...\n");

  // 1. Import site_settings
  if (backup.site_settings?.length) {
    console.log("📋 Importing site_settings...");
    const { error } = await supabase
      .from("site_settings")
      .upsert(backup.site_settings, { onConflict: "id" });
    if (error) console.error("  ❌ site_settings error:", error.message);
    else console.log(`  ✅ ${backup.site_settings.length} site_settings row(s) imported`);
  }

  // 2. Import vehicles (without status constraints — use service role)
  if (backup.vehicles?.length) {
    console.log("🚗 Importing vehicles...");

    // First insert all as draft (the trigger blocks inserting as 'available' without photos)
    for (const v of backup.vehicles) {
      const originalStatus = v.status;
      const originalFeatured = v.is_featured;
      const originalPublished = v.published_at;

      // Insert as draft first
      const insertPayload = {
        ...v,
        status: "draft",
        is_featured: false,
        published_at: null,
      };

      const { error: insertErr } = await supabase.from("vehicles").upsert(insertPayload, { onConflict: "id" });
      if (insertErr) {
        console.error(`  ❌ vehicle ${v.reference} insert error:`, insertErr.message);
        continue;
      }

      // Then update to real status after images are in place (we'll do a second pass)
      v._originalStatus = originalStatus;
      v._originalFeatured = originalFeatured;
      v._originalPublished = originalPublished;
    }
    console.log(`  ✅ ${backup.vehicles.length} vehicles inserted as draft`);
  }

  // 3. Import vehicle_images
  if (backup.vehicle_images?.length) {
    console.log("📷 Importing vehicle_images...");
    const { error } = await supabase.from("vehicle_images").upsert(backup.vehicle_images, { onConflict: "id" });
    if (error) console.error("  ❌ vehicle_images error:", error.message);
    else console.log(`  ✅ ${backup.vehicle_images.length} image(s) imported`);
  }

  // 4. Update vehicles to their real status now that images exist
  if (backup.vehicles?.length) {
    console.log("🔄 Updating vehicle statuses...");
    for (const v of backup.vehicles) {
      const { error } = await supabase
        .from("vehicles")
        .update({
          status: v._originalStatus || v.status,
          is_featured: v._originalFeatured || v.is_featured,
          published_at: v._originalPublished || v.published_at,
        })
        .eq("id", v.id);
      if (error) console.error(`  ❌ vehicle ${v.reference} status update:`, error.message);
    }
    console.log("  ✅ Vehicle statuses restored");
  }

  // 5. Create the admin user
  console.log("\n👤 Creating admin user (pokuobeng2@gmail.com)...");
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: "pokuobeng2@gmail.com",
    email_confirm: true, // Auto-confirm — no email verification needed!
    password: undefined, // User sets password via the "Create Super Admin" form
    user_metadata: { full_name: "Administrator", role: "super_admin" },
  });

  if (authErr) {
    if (authErr.message?.includes("already been registered")) {
      console.log("  ⚠️  User already exists, skipping auth creation");
    } else {
      console.error("  ❌ Auth error:", authErr.message);
      console.log("  ℹ️  You can create the admin via the signup form at /admin instead");
    }
  } else {
    console.log("  ✅ Admin auth user created (email pre-confirmed)");
  }

  console.log("\n✨ Migration complete!");
  console.log("\nNext steps:");
  console.log("  1. Update .env with the new project's URL and publishable key");
  console.log("  2. Restart the dev server (npm run dev)");
  console.log("  3. Go to http://localhost:5173/admin and sign up / sign in");
  console.log("  4. Create a 'vehicle-photos' storage bucket in the new Supabase Dashboard");
  console.log("     (Storage → New Bucket → name: 'vehicle-photos', public: false)");
}

migrate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
