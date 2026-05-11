import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PlayerReportTab } from "@/components/PlayerReportTab";

export default function ReportsPage() {
  return (
    <DashboardLayout title="Player Reports">
      <PlayerReportTab />
    </DashboardLayout>
  );
}
