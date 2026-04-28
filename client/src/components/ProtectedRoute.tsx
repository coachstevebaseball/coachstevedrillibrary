import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "athlete";
  /** Where to redirect if the user lacks the required role (default: role-based landing) */
  fallbackPath?: string;
}

/**
 * ProtectedRoute component wraps pages that require authentication.
 *
 * - Logged-out users → redirect to OAuth login with `?redirect=<current path>`
 *   so they land back where they were trying to go after auth.
 * - Logged-in users without the required role → redirect to their role-based landing.
 * - Admin has access to everything.
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Redirect to login with ?redirect= so user lands back here after auth
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = getLoginUrl(currentPath);
      return;
    }

    if (requiredRole) {
      const hasAccess = checkRoleAccess(user.role, requiredRole);
      if (!hasAccess) {
        // Redirect to role-appropriate landing
        const landing = fallbackPath || getRoleLanding(user.role);
        setLocation(landing);
      }
    }
  }, [user, loading, requiredRole, fallbackPath, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (requiredRole && !checkRoleAccess(user.role, requiredRole)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Two-role access model: admin and athlete.
 * Admin has access to everything. Athlete can access athlete routes.
 */
function checkRoleAccess(userRole: string, requiredRole: string): boolean {
  // Admin has access to everything
  if (userRole === "admin") return true;

  // Athlete can access athlete routes
  if (requiredRole === "athlete" && userRole === "athlete") return true;

  return false;
}

/**
 * Get the default landing page for a role.
 */
function getRoleLanding(role: string): string {
  if (role === "admin") return "/coach-dashboard";
  return "/athlete-portal";
}
