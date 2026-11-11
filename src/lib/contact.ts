import { formatPrice } from "./format";

/** Builds WhatsApp and telephone links used across the showroom. */

export type VehicleRef = {
  year: number;
  make: string;
  model: string;
  reference: string;
  trim?: string | null;
  price?: number | string | null;
};

/** WhatsApp wants digits only, in international format without "+". Ghana local 0XX numbers become 233XX. */
export function normaliseWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  return digits;
}

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${normaliseWhatsAppNumber(number)}?text=${encodeURIComponent(message)}`;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function vehicleLabel(v: VehicleRef): string {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
}

export function enquiryMessage(v: VehicleRef, pageUrl?: string): string {
  const lines = [
    "👋 *Hello OP Motors!*",
    "",
    "I am interested in this vehicle listed on your website:",
    `🚗 *Vehicle:* ${vehicleLabel(v)}`,
    `🏷️ *Stock ID:* ${v.reference}`,
  ];

  if (v.price) {
    lines.push(`💰 *Price:* ${formatPrice(v.price)}`);
  }

  if (pageUrl) {
    lines.push(`🔗 *Listing:* ${pageUrl}`);
  }

  lines.push("");
  lines.push("Could you please confirm if it is still available? Thank you!");
  return lines.join("\n");
}

export function generalEnquiryMessage(): string {
  const lines = [
    "👋 *Hello OP Motors!*",
    "",
    "I'm browsing your online showroom and would like to ask a few questions about your vehicles and services.",
    "",
    "Could someone from your sales team please assist me? Thank you!",
  ];
  return lines.join("\n");
}

/** Inspection requests are only requests — the dealership confirms them on WhatsApp. */
export function inspectionMessage(
  v: VehicleRef,
  preferredDate: string,
  preferredTime: string,
  customerName?: string,
): string {
  const lines = [
    "👋 *Hello OP Motors!*",
    "",
    "I would like to schedule an inspection & viewing appointment for the following vehicle:",
    `🚗 *Vehicle:* ${vehicleLabel(v)}`,
    `🏷️ *Stock ID:* ${v.reference}`,
  ];

  if (v.price) {
    lines.push(`💰 *Price:* ${formatPrice(v.price)}`);
  }

  lines.push(`📅 *Preferred Date:* ${preferredDate}`);
  lines.push(`⏰ *Preferred Time:* ${preferredTime}`);

  if (customerName?.trim()) {
    lines.push(`👤 *Name:* ${customerName.trim()}`);
  }

  lines.push("");
  lines.push("Please let me know if this slot is available or if another time works better. Thank you!");
  return lines.join("\n");
}

export function emailEnquirySubject(v: VehicleRef): string {
  return `Vehicle Enquiry: ${vehicleLabel(v)} (Stock ID: ${v.reference})`;
}

export function emailEnquiryBody(v: VehicleRef, pageUrl?: string): string {
  return enquiryMessage(v, pageUrl);
}
