import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ManageDrillVideos } from "@/pages/ManageDrillVideos";

export default function VideosPage() {
  return (
    <DashboardLayout title="Manage Videos">
      <ManageDrillVideos embedded />
    </DashboardLayout>
  );
}
