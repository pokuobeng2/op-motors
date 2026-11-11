import { useState, useEffect } from "react";
import { Save, Loader2, Building, Phone, Mail, MapPin, Clock, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/public-data.functions";
import { updateAdminSiteSettings, type SiteSettingsRow } from "@/lib/admin-data";
import { normaliseWhatsAppNumber } from "@/lib/contact";
import { toast } from "sonner";
import { AdminHeaderAction } from "./AdminShell";

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dealershipName, setDealershipName] = useState("OP Motors");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [aboutText, setAboutText] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getSiteSettings();
        if (data) {
          setDealershipName(data.dealership_name || "OP Motors");
          setTagline(data.tagline || "");
          setPhone(data.phone || "");
          setWhatsapp(data.whatsapp || "");
          setEmail(data.email || "");
          setAddress(data.address || "");
          setOpeningHours(data.opening_hours || "");
          setAboutText(data.about_text || "");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load website settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateAdminSiteSettings({
        dealership_name: dealershipName.trim(),
        tagline: tagline.trim(),
        phone: phone.trim(),
        whatsapp: normaliseWhatsAppNumber(whatsapp.trim()),
        email: email.trim(),
        address: address.trim(),
        opening_hours: openingHours.trim(),
        about_text: aboutText.trim(),
      });
      toast.success("Dealership settings saved successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top row actions */}
      <AdminHeaderAction>
        <Button
          type="submit"
          form="settings-form"
          variant="hero"
          size="sm"
          disabled={saving}
          className="gap-1 sm:gap-1.5 h-8 text-xs sm:text-sm"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Save Settings</span>
          <span className="sm:hidden">Save</span>
        </Button>
      </AdminHeaderAction>

      <form id="settings-form" onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {/* Dealership Identity */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3">
            <CardTitle className="font-display text-base sm:text-lg">Identity & Tagline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="set-name"
                  placeholder="Dealership Name"
                  required
                  value={dealershipName}
                  onChange={(e) => setDealershipName(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                id="set-tag"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Showroom Tagline"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Communication */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3">
            <CardTitle className="font-display text-base sm:text-lg">Customer Contact Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-1">
                <div className="relative">
                  <MessageCircle className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="set-wa"
                    required
                    placeholder="WhatsApp Number (e.g. 0244123456)"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {whatsapp && (
                  <p className="text-[11px] text-muted-foreground pl-1">
                    Format: {normaliseWhatsAppNumber(whatsapp) || "—"}
                  </p>
                )}
              </div>

              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="set-phone"
                  required
                  placeholder="Showroom Telephone Link"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="set-email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Physical Showroom & Operating Hours */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3">
            <CardTitle className="font-display text-base sm:text-lg">Location & Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="set-addr"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Physical Showroom Address"
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Clock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="set-hours"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="Opening Hours (e.g. Mon – Sat, 8:00am – 6:00pm)"
                  className="pl-10"
                />
              </div>
            </div>

            <Textarea
              id="set-about"
              rows={4}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="About Us Story — Dealership history, inspection standards, customer promise..."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="hero" disabled={saving} className="gap-2 w-full sm:w-auto">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
