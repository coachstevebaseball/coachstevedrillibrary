import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import LoginPage from "@/pages/LoginPage";

/**
 * RootRedirect — handles the `/` route.
 *
 * - Logged-out → show LoginPage (no drill content visible)
 * - Logged-in admin → redirect to /coach-dashboard
 * - Logged-in athlete with children (parent) → redirect to /parent-dashboard
 * - Logged-in athlete without children → redirect to /athlete-portal
 */
export default function RootRedirect() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) return; // LoginPage will render

    if (user.role === "admin") {
      setLocation("/coach-dashboard");
      return;
    }

    // Athlete: check if they have children linked
    if ((user as any).hasChildren) {
      setLocation("/parent-dashboard");
    } else {
      setLocation("/athlete-portal");
    }
  }, [user, loading, setLocation]);

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

  // Not logged in → show login page
  if (!user) {
    return <LoginPage />;
  }

  // Logged in → redirect is happening via useEffect, show loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
