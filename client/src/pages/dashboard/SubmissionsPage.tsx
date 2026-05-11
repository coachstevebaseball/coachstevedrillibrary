import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import SubmissionsDashboard from "@/pages/SubmissionsDashboard";

export default function SubmissionsPage() {
  return (
    <DashboardLayout title="Submissions">
      <SubmissionsDashboard />
    </DashboardLayout>
  );
}
