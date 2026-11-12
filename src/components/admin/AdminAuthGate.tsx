import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginStaff, useStaffSession, logoutStaff, resendConfirmationEmail } from "@/lib/admin-data";
import { Logo } from "@/components/site/Logo";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const staff = useStaffSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  if (staff.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Active session exists
  if (staff.user) {
    if (staff.profile && !staff.profile.is_active && !staff.isSuperAdmin) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-4">
          <Card className="w-full max-w-sm rounded-2xl border border-border text-center shadow-card">
            <CardHeader className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Account Deactivated</CardTitle>
              <CardDescription>
                Your account is inactive. Please contact the administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={() => staff.refresh()} variant="outline" size="sm">
                Check status
              </Button>
              <Button onClick={() => logoutStaff()} variant="ghost" size="sm" className="text-muted-foreground">
                Sign out
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
    setResendSuccess("");
    setIsSubmitting(true);

    try {
      await loginStaff(email, password);
      await staff.refresh();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="rounded-3xl border border-border bg-card shadow-card">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="font-display text-2xl font-bold tracking-tight">
              Admin Sign In
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Sign in to manage your dealership
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="flex-1 text-xs leading-relaxed">{errorMsg}</p>
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
                            setResendSuccess("Verification email resent. Check your inbox.");
                          } catch (err: unknown) {
                            setErrorMsg(err instanceof Error ? err.message : "Failed to resend confirmation email.");
                          } finally {
                            setIsResending(false);
                          }
                        }}
                        className="w-full text-xs h-8"
                      >
                        {isResending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Resend Confirmation Email
                      </Button>
                      {resendSuccess && (
                        <p className="mt-1.5 text-center text-xs text-primary font-medium">{resendSuccess}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="admin@opmotors.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full mt-2 h-10 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to website</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
