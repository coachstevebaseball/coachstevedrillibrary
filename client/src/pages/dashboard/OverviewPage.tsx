import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AthleteAssignmentOverview } from "@/components/AthleteAssignmentOverview";

export default function OverviewPage() {
  const [, navigate] = useLocation();
  return (
    <DashboardLayout title="Overview" subtitle="Athletes & assignments at a glance">
      <AthleteAssignmentOverview
        onSelectAthlete={(athleteId) => {
          navigate(`/coach-dashboard/assign?athlete=${encodeURIComponent(athleteId)}`);
        }}
      />
    </DashboardLayout>
  );
}
