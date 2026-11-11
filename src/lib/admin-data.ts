import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { VehicleStatus, AppPermission, EnquiryStatus } from "./vehicle-options";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
export type VehicleImageRow = Database["public"]["Tables"]["vehicle_images"]["Row"];
export type EnquiryRow = Database["public"]["Tables"]["enquiries"]["Row"];
export type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
export type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

export type AdminVehicle = VehicleRow & {
  vehicle_images: VehicleImageRow[];
};

export type StaffUser = ProfileRow & {
  role: "super_admin" | "staff" | null;
  permissions: AppPermission[];
};

export type AdminStats = {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  draft: number;
  archived: number;
  totalValueGh: number;
  newEnquiries: number;
};

/** Explicit primary super administrator emails defined in the codebase */
export const ADMIN_EMAILS: string[] = ["pokuobeng2@gmail.com"];

export function isExplicitAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.trim().toLowerCase());
}

/** Checks if the owner/super_admin account exists yet. */
export async function checkOwnerExists(): Promise<boolean> {
  const { data, error } = await supabase.rpc("owner_exists");
  if (error) {
    console.error("Error checking owner exists:", error);
    return true; // fail-safe
  }
  return !!data;
}

/** Signs in existing administrator or staff member. */
export async function loginStaff(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pass,
  });
  if (error) throw error;
  return data;
}

/** First-time bootstrapping for the dealership owner. Promoted to super_admin by database trigger. */
export async function bootstrapOwner(email: string, pass: string, fullName: string) {
  const isAdmin = isExplicitAdmin(email);
  const metadata: Record<string, unknown> = {
    full_name: fullName.trim(),
  };
  if (isAdmin) {
    metadata["role"] = "super_admin";
  }
  const options: { data?: object; emailRedirectTo?: string } = {
    data: metadata,
  };
  if (typeof window !== "undefined") {
    options.emailRedirectTo = `${window.location.origin}/admin`;
  }
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: pass,
    options,
  });
  if (error) throw error;
  return data;
}

/** Sign out */
export async function logoutStaff() {
  await supabase.auth.signOut();
}

/** Resend email confirmation / signup link */
export async function resendConfirmationEmail(email: string) {
  const options: { emailRedirectTo?: string } = {};
  if (typeof window !== "undefined") {
    options.emailRedirectTo = `${window.location.origin}/admin`;
  }
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options,
  });
  if (error) throw error;
  return data;
}

/** Hook to fetch and monitor current staff member session, role, and permissions */
export function useStaffSession() {
  const [session, setSession] = useState<{
    user: { id: string; email?: string } | null;
    profile: ProfileRow | null;
    role: "super_admin" | "staff" | null;
    permissions: AppPermission[];
    isLoading: boolean;
  }>({
    user: null,
    profile: null,
    role: null,
    permissions: [],
    isLoading: true,
  });

  const loadDetails = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      const user = authData.session?.user;
      if (!user) {
        setSession({ user: null, profile: null, role: null, permissions: [], isLoading: false });
        return;
      }

      const isAdminEmail = isExplicitAdmin(user.email);

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // Fetch role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isSuper = isAdminEmail || roles?.some((r) => r.role === "super_admin");
      const role = isSuper ? "super_admin" : roles?.[0]?.role ?? "staff";

      // If explicit admin, ensure metadata and profile in Supabase are synchronized
      if (isAdminEmail) {
        const metadataName = user.user_metadata?.["full_name"];
        const adminName = typeof metadataName === "string" && metadataName ? metadataName : "Administrator";
        // Explicitly set role: 'super_admin' in Supabase user metadata
        void supabase.auth.updateUser({
          data: { role: "super_admin", full_name: adminName },
        });

        // Explicitly ensure profile exists
        void supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email ?? null,
              full_name: adminName,
              is_active: true,
            },
            { onConflict: "id" },
          );

        // Explicitly attempt to persist super_admin in user_roles
        if (!roles?.some((r) => r.role === "super_admin")) {
          void supabase
            .from("user_roles")
            .insert({ user_id: user.id, role: "super_admin" });
        }
      }

      // Fetch permissions
      const { data: perms } = await supabase
        .from("staff_permissions")
        .select("permission")
        .eq("user_id", user.id);

      const allPermissions: AppPermission[] = [
        "add_vehicles",
        "edit_vehicles",
        "manage_photos",
        "update_prices",
        "mark_sold",
        "manage_featured",
        "manage_enquiries",
      ];

      const permissions = isSuper
        ? allPermissions
        : ((perms?.map((p) => p.permission) ?? []) as AppPermission[]);

      const metadataName = user.user_metadata?.["full_name"];
      const resolvedName = typeof metadataName === "string" && metadataName ? metadataName : (isAdminEmail ? "Super Administrator" : "Staff Member");

      const finalProfile: ProfileRow = profile ?? {
        id: user.id,
        email: user.email ?? null,
        full_name: resolvedName,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSession({
        user: { id: user.id, ...(user.email ? { email: user.email } : {}) },
        profile: finalProfile,
        role,
        permissions,
        isLoading: false,
      });
    } catch (e) {
      console.error("Failed loading staff session", e);
      setSession((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadDetails();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadDetails();
    });
    return () => listener.subscription.unsubscribe();
  }, [loadDetails]);

  const isSuperAdmin = session.role === "super_admin";
  const hasPerm = useCallback(
    (perm: AppPermission) => isSuperAdmin || session.permissions.includes(perm),
    [isSuperAdmin, session.permissions],
  );

  return {
    ...session,
    refresh: loadDetails,
    isSuperAdmin,
    canAddVehicles: hasPerm("add_vehicles"),
    canEditVehicles: hasPerm("edit_vehicles"),
    canManagePhotos: hasPerm("manage_photos"),
    canUpdatePrices: hasPerm("update_prices"),
    canMarkSold: hasPerm("mark_sold"),
    canManageFeatured: hasPerm("manage_featured"),
    canManageEnquiries: hasPerm("manage_enquiries"),
  };
}

/** Load inventory overview statistics */
export async function getAdminStats(): Promise<AdminStats> {
  const [vehiclesRes, enquiriesRes] = await Promise.all([
    supabase.from("vehicles").select("status, price"),
    supabase.from("enquiries").select("status").eq("status", "new"),
  ]);

  const vehicles = vehiclesRes.data ?? [];
  let totalValue = 0;
  let available = 0;
  let reserved = 0;
  let sold = 0;
  let draft = 0;
  let archived = 0;

  for (const v of vehicles) {
    if (v.status === "available") {
      available++;
      totalValue += Number(v.price) || 0;
    } else if (v.status === "reserved") {
      reserved++;
      totalValue += Number(v.price) || 0;
    } else if (v.status === "sold") {
      sold++;
    } else if (v.status === "draft") {
      draft++;
    } else if (v.status === "archived") {
      archived++;
    }
  }

  return {
    total: vehicles.length,
    available,
    reserved,
    sold,
    draft,
    archived,
    totalValueGh: totalValue,
    newEnquiries: enquiriesRes.data?.length ?? 0,
  };
}

/** Fetch all vehicles with photos for admin table */
export async function getAdminVehicles(statusFilter?: VehicleStatus | "all"): Promise<AdminVehicle[]> {
  let query = supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as AdminVehicle[]).map((v) => ({
    ...v,
    vehicle_images: (v.vehicle_images ?? []).sort((a, b) => a.position - b.position),
  }));
}

/** Fetch single vehicle by id with photos */
export async function getAdminVehicleById(id: string): Promise<AdminVehicle | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...(data as AdminVehicle),
    vehicle_images: (data.vehicle_images ?? []).sort((a, b) => a.position - b.position),
  };
}

/** Create a new vehicle listing */
export async function createVehicle(payload: {
  make: string;
  model: string;
  year: number;
  trim?: string;
  price: number;
  mileage: number;
  engine_capacity: string;
  fuel_type: string;
  transmission: string;
  body_type: string;
  exterior_colour: string;
  interior_colour?: string;
  drivetrain?: string;
  doors?: number;
  condition: string;
  country_of_import?: string;
  description: string;
  features?: string[];
  status: VehicleStatus;
  is_featured?: boolean;
}): Promise<VehicleRow> {
  // Always insert as draft first to comply with database trigger if no photo is attached yet,
  // then update if photo already added.
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      ...payload,
      status: "draft", // initial insert safe from "Add a main photograph" trigger
      is_featured: false,
    })
    .select()
    .single();

  if (error) throw error;

  // If status was meant to be draft, we are done
  if (payload.status === "draft") return data;

  return data;
}

/** Update existing vehicle specifications */
export async function updateVehicle(
  id: string,
  payload: Partial<Omit<VehicleRow, "id" | "reference" | "slug" | "created_at" | "updated_at">>,
): Promise<VehicleRow> {
  const { data, error } = await supabase
    .from("vehicles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Quick status changer (Available, Reserved, Sold, Withdrawn, Archived, Draft) */
export async function setVehicleStatus(id: string, status: VehicleStatus): Promise<void> {
  const { error } = await supabase.from("vehicles").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Toggle vehicle featured status */
export async function toggleVehicleFeatured(id: string, is_featured: boolean): Promise<void> {
  const { error } = await supabase.from("vehicles").update({ is_featured }).eq("id", id);
  if (error) throw error;
}

/** Permanently delete vehicle record */
export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}

/** Add an image record to a vehicle */
export async function addVehicleImage(
  vehicle_id: string,
  url: string,
  position: number = 0,
  alt?: string,
  storage_path?: string,
): Promise<VehicleImageRow> {
  const { data, error } = await supabase
    .from("vehicle_images")
    .insert({
      vehicle_id,
      url,
      position,
      alt: alt ?? "",
      storage_path,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Remove an image record */
export async function removeVehicleImage(imageId: string): Promise<void> {
  const { error } = await supabase.from("vehicle_images").delete().eq("id", imageId);
  if (error) throw error;
}

/** Reorder images by updating position column */
export async function reorderVehicleImages(
  ordered: { id: string; position: number }[],
): Promise<void> {
  for (const item of ordered) {
    await supabase.from("vehicle_images").update({ position: item.position }).eq("id", item.id);
  }
}

/** Client-side image optimization: downscales high-res camera/phone photos to max 1600px and compresses to clean JPEG */
export async function optimizeImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.82,
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    // If not an image, fail gracefully
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              resolve({ blob: file, dataUrl });
            }
          },
          "image/jpeg",
          quality,
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Upload photo to vehicle-photos storage bucket or fallback to optimized data URL */
export async function uploadVehiclePhoto(
  file: File,
): Promise<{ url: string; path: string; isCloudStorage: boolean }> {
  const { blob, dataUrl } = await optimizeImage(file);
  const ext = "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  try {
    // Try uploading to Supabase storage bucket
    const { error: uploadError } = await supabase.storage.from("vehicle-photos").upload(path, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/jpeg",
    });

    if (uploadError) {
      console.warn("Storage upload failed, using optimized local data URL:", uploadError.message);
      return { url: dataUrl, path: "", isCloudStorage: false };
    }

    const { data } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
    return { url: data.publicUrl, path, isCloudStorage: true };
  } catch (err) {
    console.warn("Storage upload exception, using fallback data URL:", err);
    return { url: dataUrl, path: "", isCloudStorage: false };
  }
}

/** Upload multiple photos in parallel */
export async function uploadMultipleVehiclePhotos(
  files: File[],
  onProgress?: (current: number, total: number) => void,
): Promise<{ url: string; path: string; name: string; isCloudStorage: boolean }[]> {
  const results: { url: string; path: string; name: string; isCloudStorage: boolean }[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploaded = await uploadVehiclePhoto(file);
    results.push({
      ...uploaded,
      name: file.name.replace(/\.[^/.]+$/, ""),
    });
    onProgress?.(i + 1, files.length);
  }
  return results;
}

/** Customer Enquiries */
export async function getAdminEnquiries(statusFilter?: EnquiryStatus | "all"): Promise<EnquiryRow[]> {
  let query = supabase.from("enquiries").select("*").order("enquiry_date", { ascending: false });
  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createEnquiry(payload: {
  customer_name: string;
  contact_number: string;
  vehicle_id?: string;
  vehicle_label?: string;
  enquiry_date?: string;
  notes?: string;
  status?: EnquiryStatus;
}): Promise<EnquiryRow> {
  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      customer_name: payload.customer_name.trim(),
      contact_number: payload.contact_number.trim(),
      vehicle_id: payload.vehicle_id || null,
      vehicle_label: payload.vehicle_label || null,
      enquiry_date: payload.enquiry_date || new Date().toISOString().slice(0, 10),
      notes: payload.notes?.trim() || null,
      status: payload.status || "new",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEnquiry(
  id: string,
  payload: Partial<Omit<EnquiryRow, "id" | "created_at" | "updated_at">>,
): Promise<EnquiryRow> {
  const { data, error } = await supabase
    .from("enquiries")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEnquiry(id: string): Promise<void> {
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) throw error;
}

/** Staff Accounts Management */
export async function getStaffMembers(): Promise<StaffUser[]> {
  const [profilesRes, rolesRes, permsRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("user_roles").select("*"),
    supabase.from("staff_permissions").select("*"),
  ]);

  if (profilesRes.error) throw profilesRes.error;

  const profiles = profilesRes.data ?? [];
  const roles = rolesRes.data ?? [];
  const perms = permsRes.data ?? [];

  return profiles.map((p) => {
    const isExplicit = isExplicitAdmin(p.email);
    const userRole = roles.find((r) => r.user_id === p.id);
    const userPerms = perms.filter((perm) => perm.user_id === p.id).map((perm) => perm.permission as AppPermission);
    const allPermissions: AppPermission[] = [
      "add_vehicles",
      "edit_vehicles",
      "manage_photos",
      "update_prices",
      "mark_sold",
      "manage_featured",
      "manage_enquiries",
    ];
    return {
      ...p,
      role: isExplicit ? "super_admin" : (userRole?.role ?? "staff"),
      permissions: isExplicit ? allPermissions : userPerms,
    };
  });
}

export async function toggleStaffActive(userId: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ is_active }).eq("id", userId);
  if (error) throw error;
}

export async function updateStaffPermissions(
  userId: string,
  targetPermissions: AppPermission[],
): Promise<void> {
  // First delete existing permissions
  const { error: delError } = await supabase
    .from("staff_permissions")
    .delete()
    .eq("user_id", userId);

  if (delError) throw delError;

  if (targetPermissions.length === 0) return;

  const inserts = targetPermissions.map((permission) => ({
    user_id: userId,
    permission,
  }));

  const { error: insError } = await supabase.from("staff_permissions").insert(inserts);
  if (insError) throw insError;
}

/** Activity Logs */
export async function getAdminActivityLogs(limit: number = 50): Promise<ActivityLogRow[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Website Settings */
export async function updateAdminSiteSettings(
  settings: Partial<Omit<SiteSettingsRow, "id" | "updated_at">>,
): Promise<SiteSettingsRow> {
  const { data, error } = await supabase
    .from("site_settings")
    .update(settings)
    .eq("id", 1)
    .select()
    .single();

  if (error) throw error;
  return data;
}
