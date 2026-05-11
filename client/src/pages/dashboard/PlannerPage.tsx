import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import PracticePlanner from "@/components/PracticePlanner";

export default function PlannerPage() {
  return (
    <DashboardLayout title="Practice Planner">
      <PracticePlanner />
    </DashboardLayout>
  );
}
