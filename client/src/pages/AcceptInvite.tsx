import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvite() {
  const [, params] = useRoute("/accept-invite/:token");
  const [, setLocation] = useLocation();
  const token = params?.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invite details
  const { data: inviteData, isLoading: isLoadingInvite, error: inviteError } = trpc.invites.getInviteByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  // Accept invite mutation
  const acceptInviteMutation = trpc.invites.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully! Redirecting...");
      setTimeout(() => {
        setLocation("/athlete-portal");
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account");
      setIsSubmitting(false);
    },
  });

  // Validate password strength
  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("One uppercase letter");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("One lowercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("One number");
    }
    if (!/[!@#$%^&*]/.test(pwd)) {
      errors.push("One special character (!@#$%^&*)");
    }

    return { valid: errors.length === 0, errors };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid invite token");
      return;
    }

    if (!passwordValidation.valid) {
      toast.error("Password does not meet requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to the terms");
      return;
    }

    setIsSubmitting(true);
    // Note: In a real implementation, you would need to:
    // 1. Create the user account with the password
    // 2. Accept the invite
    // 3. Log the user in
    // For now, we'll just accept the invite
    acceptInviteMutation.mutate({ token, userId: 0 }); // userId will be set by backend
  };

  if (isLoadingInvite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating your invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteError || !inviteData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid Invite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {inviteError?.message || "This invite is invalid or has expired. Please contact your coach for a new invite."}
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Set up your password to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite Details */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{inviteData?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span className="text-sm">
                {new Date(inviteData?.expiresAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            </div>
          </div>

          {/* Account Setup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="w-full px-3 py-2 border rounded-md border-input bg-background text-sm pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Password must include:</p>
                  <div className="space-y-1">
                    {[
                      { check: password.length >= 8, text: "At least 8 characters" },
                      { check: /[A-Z]/.test(password), text: "One uppercase letter" },
                      { check: /[a-z]/.test(password), text: "One lowercase letter" },
                      { check: /[0-9]/.test(password), text: "One number" },
                      { check: /[!@#$%^&*]/.test(password), text: "One special character (!@#$%^&*)" },
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded-full flex items-center justify-center text-xs ${
                            req.check ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {req.check ? "✓" : "○"}
                        </div>
                        <span className={`text-xs ${req.check ? "text-green-600" : "text-muted-foreground"}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 border rounded-md border-input bg-background text-sm pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1"
                disabled={isSubmitting}
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                I agree to the terms of service and understand that I will receive drill assignments from Coach Steve
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                !passwordValidation.valid ||
                !passwordsMatch ||
                !agreeToTerms ||
                isSubmitting ||
                acceptInviteMutation.isPending
              }
            >
              {isSubmitting || acceptInviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/")}
              className="text-primary hover:underline"
            >
              Sign in here
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
