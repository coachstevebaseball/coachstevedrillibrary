import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import AthletePortal from "./pages/AthletePortal";
import DrillDetail from "./pages/DrillDetail";
import AcceptInvite from "./pages/AcceptInvite";
import DrillGeneratorPage from "./pages/DrillGeneratorPage";
import { ManageDrillVideos } from "./pages/ManageDrillVideos";
import CreateDrillDetails from "./pages/CreateDrillDetails";
import SubmissionsDashboard from "./pages/SubmissionsDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/accept-invite/:token"} component={AcceptInvite} />
      <Route path={"/drill/:id"} component={DrillDetail} />
      
      {/* Protected Routes - Admin Only */}
      <Route path={"/admin"}>
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Protected Routes - Coach Only */}
      <Route path={"/coach-dashboard"}>
        <ProtectedRoute requiredRole="coach">
          <CoachDashboard />
        </ProtectedRoute>
      </Route>
           <Route path={"/drill-generator"}>
        <ProtectedRoute requiredRole="admin">
          <DrillGeneratorPage />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/manage-drill-videos"}>
        <ProtectedRoute requiredRole="coach">
          <ManageDrillVideos />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/create-drill-details"}>
        <ProtectedRoute requiredRole="coach">
          <CreateDrillDetails />
        </ProtectedRoute>
      </Route>
      
      <Route path={"/submissions"}>
        <ProtectedRoute requiredRole="admin">
          <SubmissionsDashboard />
        </ProtectedRoute>
      </Route>      
      {/* Protected Routes - Athlete Only */}
      <Route path={"/athlete-portal"}>
        <ProtectedRoute requiredRole="athlete">
          <AthletePortal />
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
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
