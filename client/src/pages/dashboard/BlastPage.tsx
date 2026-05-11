import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BlastMetricsTab } from "@/components/BlastMetricsTab";

export default function BlastPage() {
  return (
    <DashboardLayout title="Blast Metrics">
      <BlastMetricsTab />
    </DashboardLayout>
  );
}
