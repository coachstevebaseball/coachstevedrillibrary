import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import CoachDashboard from "./pages/CoachDashboard";
// AthletePortal removed — drill library is now public
import DrillDetail from "./pages/DrillDetail";
// AcceptInvite removed — no athlete onboarding
import DrillGeneratorPage from "./pages/DrillGeneratorPage";
import { ManageDrillVideos } from "./pages/ManageDrillVideos";
import CreateDrillDetails from "./pages/CreateDrillDetails";
import SubmissionsDashboard from "./pages/SubmissionsDashboard";
import CoachMessaging from "./pages/CoachMessaging";
// AthleteMessaging removed — no athlete portal
// VerifyEmail removed — no athlete accounts
import UserManagement from "./pages/UserManagement";
import DrillsDirectory from "./pages/DrillsDirectory";
// ParentDashboard removed — no athlete accounts
import ActivityFeed from "./pages/ActivityFeed";
import DrillComparison from "./pages/DrillComparison";
import EmbedDrillLibrary from "./pages/EmbedDrillLibrary";
import EmbedDrillDetail from "./pages/EmbedDrillDetail";
import AthleteAssessment from "./pages/AthleteAssessment";
// MyProfile removed — no athlete accounts
import ProtectedRoute from "./components/ProtectedRoute";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ToastContainer } from "./components/ToastContainer";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { useEffect } from "react";

// Register service worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/drills"} component={DrillsDirectory} />

      {/* Embed Routes — streamlined views for iframe embedding */}
      <Route path={"/embed"} component={EmbedDrillLibrary} />
      <Route path={"/embed/drill/:id"} component={EmbedDrillDetail} />

      <Route path={"/drill/:id"} component={DrillDetail} />
      
      {/* Protected Routes - Admin Only */}
      <Route path={"/admin"}>
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Protected Routes - Coach Dashboard (Admin Only) */}
      <Route path={"/coach-dashboard"}>
        <ProtectedRoute requiredRole="admin">
          <CoachDashboard />
        </ProtectedRoute>
      </Route>
           <Route path={"/drill-generator"}>
        <ProtectedRoute requiredRole="admin">
          <DrillGeneratorPage />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/manage-drill-videos"}>
        <ProtectedRoute requiredRole="admin">
          <ManageDrillVideos />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/create-drill-details"}>
        <ProtectedRoute requiredRole="admin">
          <CreateDrillDetails />
        </ProtectedRoute>
      </Route>
      <Route path={"/submissions"}>
        <ProtectedRoute requiredRole="admin">
          <SubmissionsDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/user-management"}>
        <ProtectedRoute requiredRole="admin">
          <UserManagement />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/coach-messaging"}>
        <ProtectedRoute requiredRole="admin">
          <CoachMessaging />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/activity-feed"}>
        <ProtectedRoute requiredRole="admin">
          <ActivityFeed />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/drill-comparison"}>
        <ProtectedRoute requiredRole="admin">
          <DrillComparison />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/athlete-assessment"}>
        <ProtectedRoute requiredRole="admin">
          <AthleteAssessment />
        </ProtectedRoute>
      </Route>
      

      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <ToastContainer />
            <Router />
            <PWAInstallBanner />
          </TooltipProvider>
        </ThemeProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
