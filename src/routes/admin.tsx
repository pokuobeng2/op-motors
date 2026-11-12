import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminShell, type AdminTab } from "@/components/admin/AdminShell";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { VehicleTable } from "@/components/admin/VehicleTable";
import { VehicleForm } from "@/components/admin/VehicleForm";
import { EnquiryManager } from "@/components/admin/EnquiryManager";
import { StaffManager } from "@/components/admin/StaffManager";
import { ActivityLogView } from "@/components/admin/ActivityLogView";
import { SettingsForm } from "@/components/admin/SettingsForm";

type AdminSearch = {
  tab?: AdminTab | undefined;
  id?: string | undefined;
};

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): AdminSearch => {
    const tab = search["tab"] as AdminTab | undefined;
    const id = search["id"] as string | undefined;
    return {
      tab: tab || "overview",
      id: id || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Dealership Dashboard — OP Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin" });

  const currentTab: AdminTab = search.tab || "overview";
  const vehicleId = search.id;

  const handleNavigate = (tab: AdminTab, targetId?: string) => {
    navigate({
      search: () => ({
        tab,
        id: targetId || undefined,
      }),
    });
  };

  return (
    <AdminAuthGate>
      <AdminShell currentTab={currentTab} onSelectTab={(tab) => handleNavigate(tab)}>
        {currentTab === "overview" && <DashboardOverview onNavigate={handleNavigate} />}
        {currentTab === "vehicles" && <VehicleTable onNavigate={handleNavigate} />}
        {currentTab === "new-vehicle" && <VehicleForm onNavigate={handleNavigate} />}
        {currentTab === "edit-vehicle" && <VehicleForm vehicleId={vehicleId} onNavigate={handleNavigate} />}
        {currentTab === "enquiries" && <EnquiryManager />}
        {currentTab === "staff" && <StaffManager />}
        {currentTab === "activity" && <ActivityLogView />}
        {currentTab === "settings" && <SettingsForm />}
      </AdminShell>
    </AdminAuthGate>
  );
}
