import { Mail } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmailSettingsPanel } from "@/components/EmailSettingsPanel";

export default function EmailPage() {
  return (
    <DashboardLayout title="Email Settings">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="h-6 w-6 text-teal-400" />
            Email Settings & Diagnostics
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Check email config, test delivery, and fix notification issues.
          </p>
        </div>
        <EmailSettingsPanel />
      </div>
    </DashboardLayout>
  );
}
