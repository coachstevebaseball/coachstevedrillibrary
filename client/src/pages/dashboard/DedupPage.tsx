import { Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DuplicateDetectionPanel } from "@/components/DuplicateDetectionPanel";
import { FixBrokenIdsPanel } from "@/components/FixBrokenIdsPanel";

export default function DedupPage() {
  return (
    <DashboardLayout title="Dedup Athletes">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-400" />
            Duplicate Athlete Detection
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Scan for duplicate records by email or name. Keep the first, remove extras.
          </p>
        </div>
        <DuplicateDetectionPanel />
        <FixBrokenIdsPanel />
      </div>
    </DashboardLayout>
  );
}
