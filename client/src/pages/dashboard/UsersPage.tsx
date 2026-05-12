import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import UserManagement from "@/pages/UserManagement";

export default function UsersPage() {
  return (
    <DashboardLayout title="User Management">
      <UserManagement embedded />
    </DashboardLayout>
  );
}
