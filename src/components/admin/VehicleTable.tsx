import { useEffect, useState } from "react";
import {
  Search,
  PlusCircle,
  MoreVertical,
  Star,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle,
  Archive,
  Clock,
  Eye,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, formatMileage } from "@/lib/format";
import {
  getAdminVehicles,
  setVehicleStatus,
  toggleVehicleFeatured,
  deleteVehicle,
  useStaffSession,
  type AdminVehicle,
} from "@/lib/admin-data";
import type { VehicleStatus } from "@/lib/vehicle-options";
import { VEHICLE_STATUSES } from "@/lib/vehicle-options";
import { toast } from "sonner";
import { AdminHeaderAction, type AdminTab } from "./AdminShell";

interface VehicleTableProps {
  onNavigate: (tab: AdminTab, vehicleId?: string) => void;
}

export function VehicleTable({ onNavigate }: VehicleTableProps) {
  const staff = useStaffSession();
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminVehicle | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getAdminVehicles(statusTab as VehicleStatus | "all");
      setVehicles(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vehicle inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [statusTab]);

  const handleStatusChange = async (v: AdminVehicle, newStatus: VehicleStatus) => {
    try {
      setIsProcessing(true);
      await setVehicleStatus(v.id, newStatus);
      toast.success(`${v.year} ${v.make} ${v.model} marked as ${newStatus}`);
      await loadVehicles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFeatured = async (v: AdminVehicle) => {
    if (v.status !== "available") {
      toast.error("Only vehicles with 'Available' status can be featured on the homepage.");
      return;
    }
    try {
      await toggleVehicleFeatured(v.id, !v.is_featured);
      toast.success(v.is_featured ? "Removed from featured" : "Added to featured showcase");
      await loadVehicles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle featured");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsProcessing(true);
      await deleteVehicle(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.year} ${deleteTarget.make} ${deleteTarget.model}`);
      setDeleteTarget(null);
      await loadVehicles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete vehicle");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.reference.toLowerCase().includes(q) ||
      v.year.toString().includes(q) ||
      (v.trim && v.trim.toLowerCase().includes(q))
    );
  });

  const renderActionsMenu = (v: AdminVehicle) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {staff.canEditVehicles && (
          <DropdownMenuItem onClick={() => onNavigate("edit-vehicle", v.id)}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Details
          </DropdownMenuItem>
        )}

        {(v.status === "available" || v.status === "reserved") && (
          <DropdownMenuItem asChild>
            <a href={`/inventory/${v.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> View Public Page
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>

        {v.status !== "available" && (
          <DropdownMenuItem
            onClick={() => handleStatusChange(v, "available")}
            disabled={isProcessing}
          >
            <CheckCircle className="mr-2 h-4 w-4 text-success" /> Mark Available
          </DropdownMenuItem>
        )}

        {v.status !== "reserved" && (
          <DropdownMenuItem
            onClick={() => handleStatusChange(v, "reserved")}
            disabled={isProcessing}
          >
            <Clock className="mr-2 h-4 w-4 text-warning-foreground" /> Mark Reserved
          </DropdownMenuItem>
        )}

        {v.status !== "sold" && staff.canMarkSold && (
          <DropdownMenuItem
            onClick={() => handleStatusChange(v, "sold")}
            disabled={isProcessing}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Mark Sold
          </DropdownMenuItem>
        )}

        {v.status !== "archived" && (
          <DropdownMenuItem
            onClick={() => handleStatusChange(v, "archived")}
            disabled={isProcessing}
          >
            <Archive className="mr-2 h-4 w-4" /> Archive Record
          </DropdownMenuItem>
        )}

        {v.status !== "draft" && (
          <DropdownMenuItem
            onClick={() => handleStatusChange(v, "draft")}
            disabled={isProcessing}
          >
            <Eye className="mr-2 h-4 w-4" /> Revert to Draft
          </DropdownMenuItem>
        )}

        {staff.isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteTarget(v)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Vehicle
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top row actions */}
      {staff.canAddVehicles && (
        <AdminHeaderAction>
          <Button onClick={() => onNavigate("new-vehicle")} variant="hero" size="sm" className="gap-1 sm:gap-1.5 h-8 text-xs sm:text-sm">
            <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Vehicle</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </AdminHeaderAction>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
          <Tabs value={statusTab} onValueChange={setStatusTab} className="w-auto">
            <TabsList className="bg-surface p-1 inline-flex w-max min-w-full sm:min-w-0 justify-start">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-2.5 sm:px-3">All</TabsTrigger>
              <TabsTrigger value="available" className="text-xs sm:text-sm px-2.5 sm:px-3">Available</TabsTrigger>
              <TabsTrigger value="reserved" className="text-xs sm:text-sm px-2.5 sm:px-3">Reserved</TabsTrigger>
              <TabsTrigger value="sold" className="text-xs sm:text-sm px-2.5 sm:px-3">Sold</TabsTrigger>
              <TabsTrigger value="draft" className="text-xs sm:text-sm px-2.5 sm:px-3">Drafts</TabsTrigger>
              <TabsTrigger value="archived" className="text-xs sm:text-sm px-2.5 sm:px-3">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search make, model, stock ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card h-9 text-sm"
          />
        </div>
      </div>

      {/* Vehicles Card Container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="py-20 text-center px-4">
            <p className="text-lg font-semibold">No vehicles found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? "Try refining your search keyword." : "No vehicles in this status category."}
            </p>
            {staff.canAddVehicles && (
              <Button onClick={() => onNavigate("new-vehicle")} variant="outline" className="mt-4 text-sm">
                Add a new vehicle
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View (visible on small screens < md) */}
            <div className="md:hidden divide-y divide-border">
              {filteredVehicles.map((v) => {
                const mainPhoto = v.vehicle_images?.[0];
                return (
                  <div key={v.id} className="p-3.5 space-y-3 transition-colors hover:bg-surface/30">
                    <div className="flex gap-3">
                      <img
                        src={mainPhoto?.url ?? "/placeholder.svg"}
                        alt=""
                        className="h-16 w-20 rounded-xl object-cover bg-surface shrink-0 cursor-pointer"
                        onClick={() => onNavigate("edit-vehicle", v.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <p
                            className="font-semibold text-sm text-foreground line-clamp-1 cursor-pointer hover:underline"
                            onClick={() => onNavigate("edit-vehicle", v.id)}
                          >
                            {v.year} {v.make} {v.model}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(v)}
                            disabled={v.status !== "available" || !staff.canManageFeatured}
                            className={`p-1 shrink-0 ${
                              v.is_featured
                                ? "text-gold"
                                : "text-muted-foreground/30 hover:text-muted-foreground"
                            } disabled:cursor-not-allowed disabled:opacity-30`}
                            title={v.is_featured ? "Featured on homepage" : "Click to feature"}
                          >
                            <Star className={`h-4 w-4 ${v.is_featured ? "fill-gold" : ""}`} />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {v.trim ? `${v.trim} · ` : ""}
                          {v.condition} · {v.transmission}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded text-muted-foreground">
                            #{v.reference}
                          </span>
                          <Badge variant={v.status} className="capitalize text-[10px] py-0 px-1.5 font-medium">
                            {v.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <div>
                        <p className="font-display font-semibold text-sm text-foreground">{formatPrice(v.price)}</p>
                        <p className="text-[11px] text-muted-foreground">{formatMileage(v.mileage)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {staff.canEditVehicles && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate("edit-vehicle", v.id)}
                            className="h-8 text-xs gap-1 px-2.5"
                          >
                            <Edit3 className="h-3 w-3" /> Edit
                          </Button>
                        )}
                        {renderActionsMenu(v)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (visible on md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 pl-6 pr-3">Vehicle</th>
                    <th className="px-3 py-3.5">Stock ID</th>
                    <th className="px-3 py-3.5">Price (GH₵)</th>
                    <th className="px-3 py-3.5">Mileage</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-3 py-3.5 text-center">Featured</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVehicles.map((v) => {
                    const mainPhoto = v.vehicle_images?.[0];
                    return (
                      <tr key={v.id} className="transition-colors hover:bg-surface/40">
                        {/* Photo & Name */}
                        <td className="py-3.5 pl-6 pr-3">
                          <div
                            className="flex items-center gap-3.5 cursor-pointer"
                            onClick={() => onNavigate("edit-vehicle", v.id)}
                          >
                            <img
                              src={mainPhoto?.url ?? "/placeholder.svg"}
                              alt=""
                              className="h-12 w-16 rounded-xl object-cover bg-surface shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground hover:underline">
                                {v.year} {v.make} {v.model}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {v.trim ? `${v.trim} · ` : ""}
                                {v.condition} · {v.transmission}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Reference */}
                        <td className="px-3 py-3.5 font-mono text-xs text-muted-foreground">{v.reference}</td>

                        {/* Price */}
                        <td className="px-3 py-3.5 font-display font-semibold">{formatPrice(v.price)}</td>

                        {/* Mileage */}
                        <td className="px-3 py-3.5 text-muted-foreground">{formatMileage(v.mileage)}</td>

                        {/* Status Badge */}
                        <td className="px-3 py-3.5">
                          <Badge variant={v.status} className="capitalize font-medium">
                            {v.status}
                          </Badge>
                        </td>

                        {/* Featured Star */}
                        <td className="px-3 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(v)}
                            disabled={v.status !== "available" || !staff.canManageFeatured}
                            className={`rounded-full p-1.5 transition-colors ${
                              v.is_featured
                                ? "text-gold hover:text-gold/80"
                                : "text-muted-foreground/30 hover:text-muted-foreground"
                            } disabled:cursor-not-allowed disabled:opacity-30`}
                            title={v.is_featured ? "Featured on homepage" : "Click to feature"}
                          >
                            <Star className={`h-4 w-4 ${v.is_featured ? "fill-gold" : ""}`} />
                          </button>
                        </td>

                        {/* Actions Dropdown */}
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          {renderActionsMenu(v)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog (FR-020) */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <strong>
                {deleteTarget?.year} {deleteTarget?.make} {deleteTarget?.model}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
