import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import AdminDrillEditor from "@/pages/AdminDrillEditor";

export default function LibraryPage() {
  return (
    <DashboardLayout title="Drill Library">
      <AdminDrillEditor />
    </DashboardLayout>
  );
}
