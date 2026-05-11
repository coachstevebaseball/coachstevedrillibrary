import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AthleteTable } from "@/components/AthleteTable";

export default function AthletesPage() {
  return (
    <DashboardLayout title="Athletes Table">
      <AthleteTable />
    </DashboardLayout>
  );
}
