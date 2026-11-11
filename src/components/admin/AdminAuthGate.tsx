import { useState, useEffect } from "react";
import { ShieldCheck, UserCheck, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkOwnerExists, loginStaff, bootstrapOwner, useStaffSession, resendConfirmationEmail } from "@/lib/admin-data";
import { Logo } from "@/components/site/Logo";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const staff = useStaffSession();
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  useEffect(() => {
    checkOwnerExists().then((exists) => {
      setOwnerExists(exists);
      if (!exists) setIsBootstrapping(true);
    });
  }, []);

  if (staff.isLoading || ownerExists === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm font-medium text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Already logged in
  if (staff.user) {
    if (staff.profile && !staff.profile.is_active && !staff.isSuperAdmin) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-4">
          <Card className="max-w-md text-center">
            <CardHeader>
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <CardTitle className="mt-2 text-xl">Account Deactivated</CardTitle>
              <CardDescription>
                Your staff account has been deactivated by the dealership administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => staff.refresh()} variant="outline">
                Check again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (isBootstrapping) {
        await bootstrapOwner(email, password, fullName);
      } else {
        await loginStaff(email, password);
      }
      await staff.refresh();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed. Please check credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md rounded-3xl border border-border shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <Logo />
          </div>
          <CardTitle className="font-display text-2xl">
            {isBootstrapping ? "Dealership Owner Setup" : "Administration Portal"}
          </CardTitle>
          <CardDescription>
            {isBootstrapping
              ? "Welcome to OP Motors. Create the primary Super Administrator account to manage your dealership."
              : "Sign in with your authorised administrator or staff credentials. New user accounts are created exclusively by the System Administrator."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="space-y-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
                {errorMsg.toLowerCase().includes("email not confirmed") && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isResending}
                      onClick={async () => {
                        setIsResending(true);
                        setResendSuccess("");
                        try {
                          await resendConfirmationEmail(email);
                          setResendSuccess("Verification email resent! Check your inbox.");
                        } catch (err: unknown) {
                          setErrorMsg(err instanceof Error ? err.message : "Failed to resend confirmation email");
                        } finally {
                          setIsResending(false);
                        }
                      }}
                      className="w-full text-xs"
                    >
                      {isResending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                      Resend Confirmation Email
                    </Button>
                    {resendSuccess && <p className="mt-1.5 text-xs text-primary font-medium">{resendSuccess}</p>}
                  </div>
                )}
              </div>
            )}

            {isBootstrapping && (
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullname"
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@opmotors.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isBootstrapping ? "Create Super Admin Account" : "Sign In to Dashboard"}
            </Button>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Need staff access? Contact your System Administrator to create an account.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
