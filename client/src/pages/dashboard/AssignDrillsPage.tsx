import { useSearch } from "wouter";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AssignDrillsPanel } from "@/components/dashboard/AssignDrillsPanel";

export default function AssignDrillsPage() {
  const search = useSearch();
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const athleteId = params.get("athlete");
  return (
    <DashboardLayout title="Assign Drills" subtitle="Pick an athlete and a drill to assign.">
      <AssignDrillsPanel initialAthleteId={athleteId} />
    </DashboardLayout>
  );
}
