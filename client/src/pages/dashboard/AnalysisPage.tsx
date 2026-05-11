import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VideoAnalysisTab } from "@/components/VideoAnalysisTab";

export default function AnalysisPage() {
  return (
    <DashboardLayout title="Video Analysis">
      <VideoAnalysisTab />
    </DashboardLayout>
  );
}
