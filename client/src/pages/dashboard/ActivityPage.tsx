import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ActivityFeedTab } from "@/components/ActivityFeedTab";

export default function ActivityPage() {
  return (
    <DashboardLayout title="Activity Feed">
      <ActivityFeedTab />
    </DashboardLayout>
  );
}
