import { Button } from "@/components/ui/button";
import { Shield, Lock, Mail } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * Login / Request Access page shown to logged-out users.
 * No drill content is visible — just a branded landing with sign-in CTA.
 */
export default function LoginPage() {
  // Check for ?redirect= param to pass through to OAuth
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirect") || "/";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-gradient-to-br from-primary to-[#e4002b] rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <span className="text-3xl font-heading font-bold text-white">CS</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
              Coach Steve Baseball
            </h1>
            <p className="text-muted-foreground text-lg">
              Private Player Development Platform
            </p>
          </div>

          {/* Access Info */}
          <div className="space-y-4 text-left bg-card/50 border border-border/50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-[#e4002b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Invite-Only Access</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This platform is exclusively for Coach Steve's athletes and their families.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-[#e4002b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Already Have an Account?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign in below to access your drills, assignments, and training portal.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-[#e4002b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Need Access?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contact Coach Steve to receive an invite to the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={() => {
              window.location.href = getLoginUrl(redirectTo);
            }}
            className="w-full py-6 text-lg font-semibold bg-[#e4002b] hover:bg-[#c50025] text-white rounded-xl shadow-lg shadow-[#e4002b]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#e4002b]/30"
            size="lg"
          >
            Sign In
          </Button>

          <p className="text-xs text-muted-foreground">
            By signing in, you agree to Coach Steve Baseball's terms of service.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-border/20">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Coach Steve Baseball — Player Development Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
