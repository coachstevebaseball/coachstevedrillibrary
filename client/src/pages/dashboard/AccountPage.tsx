import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import MyProfile from "@/pages/MyProfile";

export default function AccountPage() {
  return (
    <DashboardLayout title="My Account">
      <MyProfile embedded />
    </DashboardLayout>
  );
}
