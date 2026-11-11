import React from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  MessageSquareText,
  Users,
  History,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/site/Logo";
import { useStaffSession, logoutStaff } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

export type AdminTab =
  | "overview"
  | "vehicles"
  | "new-vehicle"
  | "edit-vehicle"
  | "enquiries"
  | "staff"
  | "activity"
  | "settings";

interface AdminShellProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export function AdminShell({ currentTab, onSelectTab, children }: AdminShellProps) {
  const staff = useStaffSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems: { tab: AdminTab; label: string; icon: React.ElementType; superAdminOnly?: boolean }[] = [
    { tab: "overview", label: "Dashboard", icon: LayoutDashboard },
    { tab: "vehicles", label: "Manage Vehicles", icon: Car },
    { tab: "new-vehicle", label: "Add New Vehicle", icon: PlusCircle },
    { tab: "enquiries", label: "Customer Enquiries", icon: MessageSquareText },
    { tab: "staff", label: "Staff Management", icon: Users, superAdminOnly: true },
    { tab: "activity", label: "Activity Logs", icon: History, superAdminOnly: true },
    { tab: "settings", label: "Website Settings", icon: Settings, superAdminOnly: true },
  ];

  const visibleNav = navItems.filter((i) => !i.superAdminOnly || staff.isSuperAdmin);

  const handleNavClick = (tab: AdminTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  const NavLinks = () => (
    <nav className="flex flex-col gap-1">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const active = currentTab === item.tab || (currentTab === "edit-vehicle" && item.tab === "vehicles");
        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => handleNavClick(item.tab)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-surface/50 text-foreground">
      {/* Desktop Sidebar (Stationary & Viewport-Pinned) */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 lg:flex lg:flex-col lg:justify-between lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div>
          <div className="pb-6">
            <Logo />
          </div>
          <NavLinks />
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">
              {staff.profile?.full_name || staff.user?.email}
            </p>
            <Badge variant={staff.isSuperAdmin ? "gold" : "secondary"} className="shrink-0 text-[10px] py-0.5 px-2 font-medium">
              {staff.isSuperAdmin ? "Super Admin" : "Staff"}
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
              <Link to="/">
                <ExternalLink className="h-3.5 w-3.5" /> View Showroom
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutStaff()}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-3.5 sm:px-6 backdrop-blur">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Nav Toggle */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0" aria-label="Open Navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-6 flex flex-col justify-between overflow-y-auto max-h-screen">
                <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                <div>
                  <div className="pb-6">
                    <Logo />
                  </div>
                  <NavLinks />
                </div>
                <div className="mt-8 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-1.5">Signed in as:</p>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{staff.profile?.full_name || staff.user?.email}</p>
                    <Badge variant={staff.isSuperAdmin ? "gold" : "secondary"} className="shrink-0 text-[10px] py-0.5 px-2 font-medium">
                      {staff.isSuperAdmin ? "Super Admin" : "Staff"}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button asChild variant="outline" size="sm" className="w-full justify-start">
                      <Link to="/">
                        <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Showroom
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => logoutStaff()}
                      className="w-full justify-start text-destructive"
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="font-display text-base sm:text-lg font-semibold capitalize truncate">
              {currentTab === "overview"
                ? "Dashboard"
                : currentTab === "vehicles"
                  ? "Manage Vehicles"
                  : currentTab === "new-vehicle"
                    ? "Add Vehicle"
                    : currentTab === "edit-vehicle"
                      ? "Edit Vehicle"
                      : currentTab === "enquiries"
                        ? "Enquiries"
                        : currentTab === "staff"
                          ? "Staff"
                          : currentTab === "activity"
                            ? "Activity Logs"
                            : currentTab === "settings"
                              ? "Settings"
                              : currentTab}
            </h1>
          </div>

          {/* Page-specific Action Buttons Slot */}
          <div id="admin-header-actions" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0" />
        </header>

        {/* Page Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 min-w-0 max-w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

/** Component used by admin child views to inject action buttons into the top row header */
export function AdminHeaderAction({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setContainer(document.getElementById("admin-header-actions"));
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}
