import type { SupabaseClient } from "@supabase/supabase-js";

let _ensured = false;

/**
 * Ensures that the 'vehicle-photos' storage bucket exists in Supabase,
 * has public access enabled so image URLs work in <img> tags, and has
 * the appropriate size and MIME type limits.
 */
export async function ensureVehiclePhotosBucket(client: SupabaseClient): Promise<void> {
  if (_ensured) return;

  try {
    const { data: buckets, error: listErr } = await client.storage.listBuckets();
    if (listErr) {
      console.warn("[Storage] Warning listing buckets:", listErr.message);
      return;
    }

    const existing = buckets?.find((b) => b.name === "vehicle-photos" || b.id === "vehicle-photos");
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
    ];

    if (!existing) {
      const { error: createErr } = await client.storage.createBucket("vehicle-photos", {
        public: true,
        fileSizeLimit: 20 * 1024 * 1024,
        allowedMimeTypes,
      });
      if (createErr) {
        console.warn("[Storage] Warning creating vehicle-photos bucket:", createErr.message);
      } else {
        console.log("[Storage] Created public 'vehicle-photos' bucket successfully.");
        _ensured = true;
      }
    } else if (!existing.public) {
      const { error: updateErr } = await client.storage.updateBucket("vehicle-photos", {
        public: true,
        fileSizeLimit: 20 * 1024 * 1024,
        allowedMimeTypes,
      });
      if (updateErr) {
        console.warn("[Storage] Warning making vehicle-photos bucket public:", updateErr.message);
      } else {
        console.log("[Storage] Updated 'vehicle-photos' bucket to public.");
        _ensured = true;
      }
    } else {
      _ensured = true;
    }
  } catch (err) {
    console.warn("[Storage] Exception in ensureVehiclePhotosBucket:", err);
  }
}
