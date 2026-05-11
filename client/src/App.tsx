import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AthletePortal from "./pages/AthletePortal";
import DrillDetail from "./pages/DrillDetail";
import AcceptInvite from "./pages/AcceptInvite";
import DrillGeneratorPage from "./pages/DrillGeneratorPage";
import { ManageDrillVideos } from "./pages/ManageDrillVideos";
import CreateDrillDetails from "./pages/CreateDrillDetails";
import SubmissionsDashboard from "./pages/SubmissionsDashboard";
import CoachMessaging from "./pages/CoachMessaging";
import AthleteMessaging from "./pages/AthleteMessaging";
import VerifyEmail from "./pages/VerifyEmail";
import UserManagement from "./pages/UserManagement";
import ParentDashboard from "./pages/ParentDashboard";
import ActivityFeed from "./pages/ActivityFeed";
import DrillComparison from "./pages/DrillComparison";
import AthleteAssessment from "./pages/AthleteAssessment";
import ManageDrillContent from "./pages/ManageDrillContent";
import MyProfile from "./pages/MyProfile";
import NotificationsInbox from "./pages/NotificationsInbox";
import NotificationPreferences from "./pages/NotificationPreferences";
import HittingCoach from "./pages/HittingCoach";
import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";
import EmbedHome from "./pages/EmbedHome";
import EmbedDrillLibrary from "./pages/EmbedDrillLibrary";
import EmbedDrillDetail from "./pages/EmbedDrillDetail";
// New mobile-first sidebar shell pages
import OverviewPage from "./pages/dashboard/OverviewPage";
import AssignDrillsPage from "./pages/dashboard/AssignDrillsPage";
import AthletesPage from "./pages/dashboard/AthletesPage";
import UsersPage from "./pages/dashboard/UsersPage";
import PlannerPage from "./pages/dashboard/PlannerPage";
import LibraryPage from "./pages/dashboard/LibraryPage";
import VideosPage from "./pages/dashboard/VideosPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import NotesPage from "./pages/dashboard/NotesPage";
import SubmissionsPage from "./pages/dashboard/SubmissionsPage";
import BlastPage from "./pages/dashboard/BlastPage";
import AnalysisPage from "./pages/dashboard/AnalysisPage";
import ActivityPage from "./pages/dashboard/ActivityPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import EmailPage from "./pages/dashboard/EmailPage";
import TagsPage from "./pages/dashboard/TagsPage";
import DedupPage from "./pages/dashboard/DedupPage";
import AccountPage from "./pages/dashboard/AccountPage";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ToastContainer } from "./components/ToastContainer";
import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";

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

/**
 * Redirect /drills → / preserving all query params so old bookmarks still work.
 */
function DrillsRedirect() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  useEffect(() => {
    const qs = searchString.startsWith('?') ? searchString : (searchString ? `?${searchString}` : '');
    navigate(`/${qs}`, { replace: true });
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      {/* ===== Root: role-based redirect or login page ===== */}
      <Route path={"/"} component={RootRedirect} />

      {/* ===== Public Routes — No login required ===== */}
      <Route path={"/accept-invite/:token"} component={AcceptInvite} />
      <Route path={"/verify-email/:token"} component={VerifyEmail} />

      {/* ===== Drill Library (protected — any logged-in user) ===== */}
      <Route path={"/drills"}>
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path={"/drill/:id"}>
        {(params) => (
          <ProtectedRoute>
            <DrillDetail />
          </ProtectedRoute>
        )}
      </Route>

      {/* ===== Athlete Routes (protected — athlete or admin) ===== */}
      <Route path={"/athlete-portal"}>
        <ProtectedRoute requiredRole="athlete">
          <AthletePortal />
        </ProtectedRoute>
      </Route>
      <Route path={"/athlete-messaging"}>
        <ProtectedRoute requiredRole="athlete">
          <AthleteMessaging />
        </ProtectedRoute>
      </Route>
      <Route path={"/my-profile"}>
        <ProtectedRoute>
          <MyProfile />
        </ProtectedRoute>
      </Route>
      <Route path={"/notifications"}>
        <ProtectedRoute>
          <NotificationsInbox />
        </ProtectedRoute>
      </Route>
      <Route path={"/notifications/preferences"}>
        <ProtectedRoute>
          <NotificationPreferences />
        </ProtectedRoute>
      </Route>
      <Route path={"/hitting-coach"}>
        <ProtectedRoute>
          <HittingCoach />
        </ProtectedRoute>
      </Route>
      <Route path={"/parent-dashboard"}>
        <ProtectedRoute requiredRole="athlete">
          <ParentDashboard />
        </ProtectedRoute>
      </Route>

      {/* ===== Embed Routes (protected — any logged-in user) ===== */}
      <Route path="/embed">
        <ProtectedRoute>
          <EmbedHome />
        </ProtectedRoute>
      </Route>
      <Route path="/embed/drills">
        <ProtectedRoute>
          <EmbedDrillLibrary />
        </ProtectedRoute>
      </Route>
      <Route path="/embed/drill/:id">
        {(params) => (
          <ProtectedRoute>
            <EmbedDrillDetail />
          </ProtectedRoute>
        )}
      </Route>

      {/* ===== Legacy /admin redirects (folded into /coach-dashboard) ===== */}
      <Route path={"/admin"}>
        <Redirect to="/coach-dashboard" />
      </Route>
      <Route path={"/admin/drills"}>
        <Redirect to="/coach-dashboard/library" />
      </Route>

      {/* ===== New mobile-first dashboard shell ===== */}
      <Route path={"/coach-dashboard"}>
        <ProtectedRoute requiredRole="admin">
          <OverviewPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/athletes"}>
        <ProtectedRoute requiredRole="admin">
          <AthletesPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/users"}>
        <ProtectedRoute requiredRole="admin">
          <UsersPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/assign"}>
        <ProtectedRoute requiredRole="admin">
          <AssignDrillsPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/planner"}>
        <ProtectedRoute requiredRole="admin">
          <PlannerPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/library"}>
        <ProtectedRoute requiredRole="admin">
          <LibraryPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/videos"}>
        <ProtectedRoute requiredRole="admin">
          <VideosPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/reports"}>
        <ProtectedRoute requiredRole="admin">
          <ReportsPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/notes"}>
        <ProtectedRoute requiredRole="admin">
          <NotesPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/submissions"}>
        <ProtectedRoute requiredRole="admin">
          <SubmissionsPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/blast"}>
        <ProtectedRoute requiredRole="admin">
          <BlastPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/analysis"}>
        <ProtectedRoute requiredRole="admin">
          <AnalysisPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/activity"}>
        <ProtectedRoute requiredRole="admin">
          <ActivityPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/notifications"}>
        <ProtectedRoute requiredRole="admin">
          <NotificationsPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/email"}>
        <ProtectedRoute requiredRole="admin">
          <EmailPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/tags"}>
        <ProtectedRoute requiredRole="admin">
          <TagsPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/dedup"}>
        <ProtectedRoute requiredRole="admin">
          <DedupPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/coach-dashboard/account"}>
        <ProtectedRoute requiredRole="admin">
          <AccountPage />
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
      
      <Route path={"/admin/notifications"}>
        <Redirect to="/coach-dashboard/notifications" />
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
      
      <Route path={"/manage-drill-content"}>
        <ProtectedRoute requiredRole="admin">
          <ManageDrillContent />
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
          </TooltipProvider>
        </ThemeProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
