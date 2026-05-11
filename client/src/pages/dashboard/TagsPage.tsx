import { Tag } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DrillTagEditor } from "@/components/DrillTagEditor";

export default function TagsPage() {
  return (
    <DashboardLayout title="Drill Tags">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-[#e4002b]" />
            Drill Tag Editor
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Tag existing drills with type, age level, focus areas, and coaching pillars.
          </p>
        </div>
        <DrillTagEditor />
      </div>
    </DashboardLayout>
  );
}
