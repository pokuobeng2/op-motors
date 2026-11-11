import { useEffect, useState } from "react";
import {
  Car,
  CheckCircle2,
  Clock,
  Archive,
  FileEdit,
  DollarSign,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatMileage, formatDate } from "@/lib/format";
import { getAdminStats, getAdminVehicles, getAdminEnquiries, type AdminStats, type AdminVehicle, type EnquiryRow } from "@/lib/admin-data";
import { AdminHeaderAction, type AdminTab } from "./AdminShell";

interface DashboardOverviewProps {
  onNavigate: (tab: AdminTab, vehicleId?: string) => void;
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentVehicles, setRecentVehicles] = useState<AdminVehicle[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, v, e] = await Promise.all([
          getAdminStats(),
          getAdminVehicles("all"),
          getAdminEnquiries("all"),
        ]);
        setStats(s);
        setRecentVehicles(v.slice(0, 5));
        setRecentEnquiries(e.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Available in Showroom",
      value: stats?.available ?? 0,
      sub: `${formatPrice(stats?.totalValueGh)} active inventory`,
      icon: Car,
      color: "text-success",
      bg: "bg-success/10",
      tab: "vehicles" as AdminTab,
    },
    {
      title: "Reserved Vehicles",
      value: stats?.reserved ?? 0,
      sub: "Temporarily on hold",
      icon: Clock,
      color: "text-warning-foreground",
      bg: "bg-warning/15",
      tab: "vehicles" as AdminTab,
    },
    {
      title: "Sold Vehicles",
      value: stats?.sold ?? 0,
      sub: "Completed dealership sales",
      icon: CheckCircle2,
      color: "text-primary",
      bg: "bg-primary/10",
      tab: "vehicles" as AdminTab,
    },
    {
      title: "Draft Listings",
      value: stats?.draft ?? 0,
      sub: "Being prepared, not public",
      icon: FileEdit,
      color: "text-muted-foreground",
      bg: "bg-surface-strong",
      tab: "vehicles" as AdminTab,
    },
    {
      title: "Archived Vehicles",
      value: stats?.archived ?? 0,
      sub: "Internal record retention",
      icon: Archive,
      color: "text-muted-foreground",
      bg: "bg-surface-strong",
      tab: "vehicles" as AdminTab,
    },
    {
      title: "New Customer Enquiries",
      value: stats?.newEnquiries ?? 0,
      sub: "Requires follow-up",
      icon: MessageSquare,
      color: "text-gold",
      bg: "bg-gold/15",
      tab: "enquiries" as AdminTab,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top row actions */}
      <AdminHeaderAction>
        <Button onClick={() => onNavigate("new-vehicle")} variant="hero" size="sm" className="gap-1 sm:gap-1.5 h-8 text-xs sm:text-sm">
          <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Add Vehicle</span>
          <span className="sm:hidden">Add</span>
        </Button>
        <Button onClick={() => onNavigate("enquiries")} variant="outline" size="sm" className="gap-1 sm:gap-1.5 h-8 text-xs sm:text-sm">
          <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Record Enquiry</span>
          <span className="sm:hidden">Enquiry</span>
        </Button>
      </AdminHeaderAction>

      {/* Metrics Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.title}
              className="group cursor-pointer rounded-2xl border-border transition-all duration-300 hover:border-foreground/30 hover:shadow-card"
              onClick={() => onNavigate(c.tab)}
            >
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <div className={`rounded-xl p-2 sm:p-2.5 ${c.bg}`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="font-display text-2xl sm:text-3xl font-bold">{c.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Split Section: Recent Inventory & Recent Enquiries */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        {/* Recent Inventory */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3">
            <CardTitle className="font-display text-base sm:text-lg">Recent Vehicles</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("vehicles")}
              className="gap-1 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {recentVehicles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No vehicles listed yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {recentVehicles.map((v) => {
                  const img = v.vehicle_images?.[0];
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-3 sm:gap-4 py-3 cursor-pointer hover:bg-surface/50 rounded-lg px-1 sm:px-2 transition-colors"
                      onClick={() => onNavigate("edit-vehicle", v.id)}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <img
                          src={img?.url ?? "/placeholder.svg"}
                          alt=""
                          className="h-11 w-14 sm:h-12 sm:w-16 rounded-lg object-cover bg-surface shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs sm:text-sm font-semibold">
                            {v.year} {v.make} {v.model}
                          </p>
                          <p className="truncate text-[11px] sm:text-xs text-muted-foreground">
                            Stock #{v.reference} · {formatMileage(v.mileage)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-xs sm:text-sm font-semibold">{formatPrice(v.price)}</p>
                        <Badge variant={v.status} className="mt-0.5 capitalize text-[9px] sm:text-[10px]">
                          {v.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Enquiries */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3">
            <CardTitle className="font-display text-base sm:text-lg">Customer Enquiries</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("enquiries")}
              className="gap-1 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {recentEnquiries.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <p>No customer enquiries recorded yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("enquiries")}
                  className="mt-3 text-xs"
                >
                  Record first enquiry
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentEnquiries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 sm:gap-4 py-3 cursor-pointer hover:bg-surface/50 rounded-lg px-1 sm:px-2 transition-colors"
                    onClick={() => onNavigate("enquiries")}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-semibold">{e.customer_name}</p>
                      <p className="truncate text-[11px] sm:text-xs text-muted-foreground">
                        {e.vehicle_label || "General enquiry"} · {e.contact_number}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={e.status === "new" ? "gold" : "outline"} className="capitalize text-[9px] sm:text-[10px]">
                        {e.status.replace("_", " ")}
                      </Badge>
                      <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground">{formatDate(e.enquiry_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
