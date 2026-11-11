import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  Check,
  UserCheck,
  UserX,
  UserPlus,
  Key,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getStaffMembers,
  toggleStaffActive,
  updateStaffPermissions,
  useStaffSession,
  type StaffUser,
} from "@/lib/admin-data";
import { supabase } from "@/integrations/supabase/client";
import { createStaffUser } from "@/lib/admin.functions";
import { PERMISSIONS, type AppPermission } from "@/lib/vehicle-options";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { AdminHeaderAction } from "./AdminShell";

export function StaffManager() {
  const staffSession = useStaffSession();
  const [members, setMembers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<StaffUser | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<AppPermission[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // New staff creation state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"staff" | "super_admin">("staff");
  const [newPermissions, setNewPermissions] = useState<AppPermission[]>([
    "add_vehicles",
    "edit_vehicles",
    "manage_photos",
    "manage_enquiries",
  ]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getStaffMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleOpenPermissions = (user: StaffUser) => {
    setEditingPermissionsUser(user);
    setSelectedPermissions(user.permissions);
  };

  const handleTogglePermission = (perm: AppPermission) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingPermissionsUser) return;
    try {
      setIsSavingPermissions(true);
      await updateStaffPermissions(editingPermissionsUser.id, selectedPermissions);
      toast.success(`Updated permissions for ${editingPermissionsUser.full_name || editingPermissionsUser.email}`);
      setEditingPermissionsUser(null);
      await loadMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update permissions");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleToggleActive = async (user: StaffUser) => {
    if (user.id === staffSession.user?.id) {
      toast.error("You cannot deactivate your own account.");
      return;
    }
    try {
      const next = !user.is_active;
      await toggleStaffActive(user.id, next);
      toast.success(next ? "Account reactivated" : "Account deactivated");
      await loadMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change account status");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword || !newFullName.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsCreatingUser(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Authentication expired. Please sign in again.");
        return;
      }

      await createStaffUser({
        data: {
          fullName: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
          permissions: newRole === "super_admin" ? [] : newPermissions,
          sessionToken: token,
        },
      });

      toast.success(`User ${newFullName} (${newEmail}) created successfully!`);
      setIsCreateOpen(false);
      setNewFullName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("staff");
      setNewPermissions(["add_vehicles", "edit_vehicles", "manage_photos", "manage_enquiries"]);
      await loadMembers();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to create user account");
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      {/* Top row actions */}
      {staffSession.isSuperAdmin && (
        <AdminHeaderAction>
          <Button variant="hero" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1 sm:gap-1.5 h-8 text-xs sm:text-sm shrink-0">
            <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Staff Member</span>
            <span className="sm:hidden">Add Staff</span>
          </Button>
        </AdminHeaderAction>
      )}

      {/* Staff Members Container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground px-4">No staff members found.</div>
        ) : (
          <>
            {/* Mobile Card List (visible on screens < md) */}
            <div className="md:hidden divide-y divide-border">
              {members.map((m) => {
                const isSuper = m.role === "super_admin";
                const isCurrent = m.id === staffSession.user?.id;

                return (
                  <div key={m.id} className="p-3.5 space-y-3 transition-colors hover:bg-surface/30">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-strong font-semibold text-xs">
                          {(m.full_name || m.email || "S").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {m.full_name || "Unnamed Staff Member"}
                            {isCurrent && <span className="ml-1 text-xs text-muted-foreground font-normal">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        </div>
                      </div>
                      <Badge variant={m.is_active ? "available" : "withdrawn"} className="text-[10px] shrink-0">
                        {m.is_active ? "Active" : "Deactivated"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <Badge variant={isSuper ? "gold" : "secondary"} className="text-[10px]">
                        {isSuper ? "Super Admin" : "Staff"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">Joined {formatDate(m.created_at)}</span>
                    </div>

                    {/* Permissions summary */}
                    <div className="rounded-lg bg-surface/50 p-2 text-xs">
                      {isSuper ? (
                        <span className="text-xs font-medium text-gold">Full Access (All Permissions)</span>
                      ) : m.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No permissions assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.permissions.map((p) => (
                            <Badge key={p} variant="outline" className="text-[9px] py-0 px-1.5">
                              {PERMISSIONS.find((x) => x.value === p)?.label ?? p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                      {!isSuper && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPermissions(m)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Key className="h-3.5 w-3.5" /> Permissions
                        </Button>
                      )}

                      {!isCurrent && (
                        <Button
                          variant={m.is_active ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => handleToggleActive(m)}
                          className={`h-8 text-xs ${m.is_active ? "text-destructive hover:bg-destructive/10" : "text-success"}`}
                        >
                          {m.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          <span className="ml-1">{m.is_active ? "Deactivate" : "Activate"}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (visible on screens >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 pl-6 pr-3">Staff Member</th>
                    <th className="px-3 py-3.5">Role</th>
                    <th className="px-3 py-3.5">Assigned Permissions</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-3 py-3.5">Joined</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => {
                    const isSuper = m.role === "super_admin";
                    const isCurrent = m.id === staffSession.user?.id;

                    return (
                      <tr key={m.id} className="transition-colors hover:bg-surface/40">
                        {/* Name & Email */}
                        <td className="py-3.5 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-strong font-semibold text-xs">
                              {(m.full_name || m.email || "S").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {m.full_name || "Unnamed Staff Member"}
                                {isCurrent && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{m.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="px-3 py-3.5">
                          <Badge variant={isSuper ? "gold" : "secondary"}>
                            {isSuper ? "Super Admin" : "Staff"}
                          </Badge>
                        </td>

                        {/* Permissions List */}
                        <td className="px-3 py-3.5">
                          {isSuper ? (
                            <span className="text-xs font-medium text-gold">Full Access (All Permissions)</span>
                          ) : m.permissions.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No permissions assigned</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {m.permissions.map((p) => (
                                <Badge key={p} variant="outline" className="text-[10px] py-0 px-1.5">
                                  {PERMISSIONS.find((x) => x.value === p)?.label ?? p}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Active Status */}
                        <td className="px-3 py-3.5">
                          <Badge variant={m.is_active ? "available" : "withdrawn"}>
                            {m.is_active ? "Active" : "Deactivated"}
                          </Badge>
                        </td>

                        {/* Joined Date */}
                        <td className="px-3 py-3.5 text-xs text-muted-foreground">{formatDate(m.created_at)}</td>

                        {/* Action Buttons */}
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isSuper && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPermissions(m)}
                                className="text-xs gap-1.5"
                              >
                                <Key className="h-3.5 w-3.5" /> Permissions
                              </Button>
                            )}

                            {!isCurrent && (
                              <Button
                                variant={m.is_active ? "ghost" : "outline"}
                                size="sm"
                                onClick={() => handleToggleActive(m)}
                                className={`text-xs ${m.is_active ? "text-destructive hover:bg-destructive/10" : "text-success"}`}
                              >
                                {m.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                                <span className="ml-1">{m.is_active ? "Deactivate" : "Activate"}</span>
                              </Button>
                            )}
                          </div>
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

      {/* Permissions Editor Dialog */}
      <Dialog open={!!editingPermissionsUser} onOpenChange={(open) => !open && setEditingPermissionsUser(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Manage Staff Permissions</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingPermissionsUser?.full_name || editingPermissionsUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              {PERMISSIONS.map((p) => {
                const checked = selectedPermissions.includes(p.value);
                return (
                  <label
                    key={p.value}
                    className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-surface transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => handleTogglePermission(p.value)}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setEditingPermissionsUser(null)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleSavePermissions} disabled={isSavingPermissions}>
                {isSavingPermissions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Staff Member Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-gold" />
              Add New Staff Member
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5 pt-2">
            <Input
              id="create-fullname"
              placeholder="Full Name"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              required
            />

            <Input
              id="create-email"
              type="email"
              placeholder="Email Address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />

            <Input
              id="create-password"
              type="password"
              placeholder="Initial Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />

            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewRole("staff")}
                  className={`flex flex-col text-left p-3 rounded-xl border text-sm transition-colors cursor-pointer ${
                    newRole === "staff"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  <span className="font-semibold">Staff Member</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Custom permissions
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewRole("super_admin")}
                  className={`flex flex-col text-left p-3 rounded-xl border text-sm transition-colors cursor-pointer ${
                    newRole === "super_admin"
                      ? "border-gold bg-gold/5 ring-1 ring-gold"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  <span className="font-semibold text-gold">Super Admin</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Full system access
                  </span>
                </button>
              </div>
            </div>

            {newRole === "staff" && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Initial Assigned Permissions
                </Label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {PERMISSIONS.map((p) => {
                    const checked = newPermissions.includes(p.value);
                    return (
                      <label
                        key={p.value}
                        className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 cursor-pointer hover:bg-surface transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => {
                            if (checked) {
                              setNewPermissions(newPermissions.filter((x) => x !== p.value));
                            } else {
                              setNewPermissions([...newPermissions, p.value]);
                            }
                          }}
                          className="mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold">{p.label}</p>
                          <p className="text-[11px] text-muted-foreground">{p.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreatingUser}
              >
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isCreatingUser}>
                {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Staff Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
