import { useState, useEffect } from "react";
import {
  Plus,
  MessageCircle,
  Phone,
  Trash2,
  Calendar,
  CheckCircle,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { whatsappLink, telLink } from "@/lib/contact";
import {
  getAdminEnquiries,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getAdminVehicles,
  type EnquiryRow,
  type AdminVehicle,
} from "@/lib/admin-data";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/lib/vehicle-options";
import { toast } from "sonner";
import { AdminHeaderAction } from "./AdminShell";

export function EnquiryManager() {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Record Dialog Form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("none");
  const [enquiryDate, setEnquiryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [enquiryStatus, setEnquiryStatus] = useState<EnquiryStatus>("new");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enqs, vehts] = await Promise.all([
        getAdminEnquiries(statusFilter as EnquiryStatus | "all"),
        getAdminVehicles("all"),
      ]);
      setEnquiries(enqs);
      setVehicles(vehts);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !contactNumber.trim()) {
      toast.error("Please provide both customer name and contact phone number");
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenVehicle = vehicles.find((v) => v.id === selectedVehicleId);
      const vehicleLabel = chosenVehicle
        ? `${chosenVehicle.year} ${chosenVehicle.make} ${chosenVehicle.model} (Stock ID: ${chosenVehicle.reference})`
        : undefined;

      await createEnquiry({
        customer_name: customerName,
        contact_number: contactNumber,
        vehicle_id: selectedVehicleId === "none" ? undefined : selectedVehicleId,
        vehicle_label: vehicleLabel,
        enquiry_date: enquiryDate,
        notes,
        status: enquiryStatus,
      });

      toast.success("Enquiry recorded successfully");
      setDialogOpen(false);
      setCustomerName("");
      setContactNumber("");
      setSelectedVehicleId("none");
      setNotes("");
      setEnquiryStatus("new");
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record enquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (enquiryId: string, newStatus: EnquiryStatus) => {
    try {
      await updateEnquiry(enquiryId, { status: newStatus });
      toast.success("Status updated");
      setEnquiries((prev) => prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDelete = async (enquiryId: string) => {
    try {
      await deleteEnquiry(enquiryId);
      toast.success("Enquiry record removed");
      setEnquiries((prev) => prev.filter((e) => e.id !== enquiryId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete enquiry");
    }
  };

  const filtered = enquiries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.customer_name.toLowerCase().includes(q) ||
      e.contact_number.toLowerCase().includes(q) ||
      (e.vehicle_label && e.vehicle_label.toLowerCase().includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top row action */}
      <AdminHeaderAction>
        <Button variant="hero" size="sm" onClick={() => setDialogOpen(true)} className="gap-1 sm:gap-1.5 h-8 text-xs sm:text-sm">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Record Enquiry</span>
          <span className="sm:hidden">Enquiry</span>
        </Button>
      </AdminHeaderAction>

      {/* Action Toolbar */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
            <TabsList className="bg-surface p-1 inline-flex w-max min-w-full sm:min-w-0 justify-start">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-2.5 sm:px-3">All</TabsTrigger>
              <TabsTrigger value="new" className="text-xs sm:text-sm px-2.5 sm:px-3">New</TabsTrigger>
              <TabsTrigger value="contacted" className="text-xs sm:text-sm px-2.5 sm:px-3">Contacted</TabsTrigger>
              <TabsTrigger value="follow_up" className="text-xs sm:text-sm px-2.5 sm:px-3">Follow Up</TabsTrigger>
              <TabsTrigger value="inspection_booked" className="text-xs sm:text-sm px-2.5 sm:px-3">Inspection</TabsTrigger>
              <TabsTrigger value="won" className="text-xs sm:text-sm px-2.5 sm:px-3">Won / Sold</TabsTrigger>
              <TabsTrigger value="lost" className="text-xs sm:text-sm px-2.5 sm:px-3">Lost</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search enquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card h-9 text-sm"
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Record Customer Enquiry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="cust-name"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <Input
                id="cust-phone"
                placeholder="Contact Phone / WhatsApp"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />
            </div>

            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger id="cust-veh">
                <SelectValue placeholder="Vehicle of Interest (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General Inquiry / No Specific Vehicle</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model} (Stock #{v.reference})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="cust-date"
                type="date"
                title="Enquiry Date"
                value={enquiryDate}
                onChange={(e) => setEnquiryDate(e.target.value)}
              />
              <Select value={enquiryStatus} onValueChange={(v) => setEnquiryStatus(v as EnquiryStatus)}>
                <SelectTrigger id="cust-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ENQUIRY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              id="cust-notes"
              rows={3}
              placeholder="Notes & Requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Enquiry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enquiries Card Container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center px-4">
            <p className="text-lg font-semibold">No enquiries found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "No matches for your search keyword." : "No enquiries currently in this status."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (visible on screens < md) */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((enq) => (
                <div key={enq.id} className="p-3.5 space-y-3 transition-colors hover:bg-surface/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{enq.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{enq.contact_number}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(enq.enquiry_date)}</span>
                  </div>

                  <div className="rounded-lg bg-surface/60 p-2 text-xs">
                    <p className="font-medium text-foreground truncate">
                      🚗 {enq.vehicle_label || "General Inquiry"}
                    </p>
                    {enq.notes && (
                      <p className="mt-1 text-muted-foreground line-clamp-2 text-[11px]">
                        {enq.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                    <Select
                      value={enq.status}
                      onValueChange={(val) => handleStatusChange(enq.id, val as EnquiryStatus)}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENQUIRY_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button asChild variant="whatsapp" size="icon-sm" className="h-8 w-8" title="Chat on WhatsApp">
                        <a
                          href={whatsappLink(
                            enq.contact_number,
                            enq.vehicle_label
                              ? [
                                  `👋 *Hello ${enq.customer_name || "there"}!*`,
                                  "",
                                  "This is *OP Motors* following up on your enquiry regarding:",
                                  `🚗 *${enq.vehicle_label}*`,
                                  "",
                                  "How can our team assist you today? We would be delighted to answer any questions or arrange a test-drive inspection for you! ✨",
                                ].join("\n")
                              : [
                                  `👋 *Hello ${enq.customer_name || "there"}!*`,
                                  "",
                                  "This is *OP Motors* following up on your recent enquiry with our showroom.",
                                  "",
                                  "How can our sales team assist you today? Please feel free to ask any questions about our current vehicle stock or services! ✨",
                                ].join("\n")
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="icon-sm" className="h-8 w-8" title="Call Customer">
                        <a href={telLink(enq.contact_number)}>
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(enq.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete enquiry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (visible on screens >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 pl-6 pr-3">Customer</th>
                    <th className="px-3 py-3.5">Vehicle of Interest</th>
                    <th className="px-3 py-3.5">Date</th>
                    <th className="px-3 py-3.5">Notes</th>
                    <th className="px-3 py-3.5">Follow-up Status</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Connect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((enq) => (
                    <tr key={enq.id} className="transition-colors hover:bg-surface/40">
                      {/* Customer */}
                      <td className="py-3.5 pl-6 pr-3">
                        <p className="font-semibold">{enq.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{enq.contact_number}</p>
                      </td>

                      {/* Vehicle */}
                      <td className="px-3 py-3.5">
                        <p className="text-sm font-medium">{enq.vehicle_label || "General Inquiry"}</p>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3.5 text-xs text-muted-foreground">{formatDate(enq.enquiry_date)}</td>

                      {/* Notes */}
                      <td className="px-3 py-3.5 max-w-xs">
                        <p className="line-clamp-2 text-xs text-muted-foreground">{enq.notes || "—"}</p>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-3 py-3.5">
                        <Select
                          value={enq.status}
                          onValueChange={(val) => handleStatusChange(enq.id, val as EnquiryStatus)}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ENQUIRY_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Connect Actions */}
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild variant="whatsapp" size="icon-sm" title="Chat on WhatsApp">
                            <a
                              href={whatsappLink(
                                enq.contact_number,
                                enq.vehicle_label
                                  ? [
                                      `👋 *Hello ${enq.customer_name || "there"}!*`,
                                      "",
                                      "This is *OP Motors* following up on your enquiry regarding:",
                                      `🚗 *${enq.vehicle_label}*`,
                                      "",
                                      "How can our team assist you today? We would be delighted to answer any questions or arrange a test-drive inspection for you! ✨",
                                    ].join("\n")
                                  : [
                                      `👋 *Hello ${enq.customer_name || "there"}!*`,
                                      "",
                                      "This is *OP Motors* following up on your recent enquiry with our showroom.",
                                      "",
                                      "How can our sales team assist you today? Please feel free to ask any questions about our current vehicle stock or services! ✨",
                                    ].join("\n")
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="icon-sm" title="Call Customer">
                            <a href={telLink(enq.contact_number)}>
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(enq.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete enquiry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
