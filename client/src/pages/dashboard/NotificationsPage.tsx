import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import NotificationsInbox from "@/pages/NotificationsInbox";

export default function NotificationsPage() {
  return (
    <DashboardLayout title="Notifications">
      <NotificationsInbox />
    </DashboardLayout>
  );
}
