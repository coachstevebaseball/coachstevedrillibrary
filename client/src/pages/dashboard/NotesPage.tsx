import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SessionNotesTab } from "@/components/SessionNotesTab";

export default function NotesPage() {
  return (
    <DashboardLayout title="Session Notes">
      <SessionNotesTab />
    </DashboardLayout>
  );
}
