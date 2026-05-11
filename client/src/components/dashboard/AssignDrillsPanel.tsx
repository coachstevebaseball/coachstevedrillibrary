import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useAllDrills } from "@/hooks/useAllDrills";
import { AthleteProgressReport } from "@/components/AthleteProgressReport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, CheckCircle, Clock, AlertCircle, Search, BarChart3, Target, Users,
} from "lucide-react";

interface Drill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
}

type Props = {
  initialAthleteId?: string | null;
};

export function AssignDrillsPanel({ initialAthleteId = null }: Props) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [selectedUser, setSelectedUser] = useState<string | null>(initialAthleteId);
  const [searchDrill, setSearchDrill] = useState("");
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [showProgressReport, setShowProgressReport] = useState(false);

  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: allInvites = [] } = trpc.invites.getAllInvites.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: allAssignments = [] } = trpc.drillAssignments.getAllAssignments.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const assignDrillMutation = trpc.drillAssignments.assignDrill.useMutation({
    onSuccess: () => utils.drillAssignments.getAllAssignments.invalidate(),
  });
  const unassignDrillMutation = trpc.drillAssignments.unassignDrill.useMutation();
  const updateStatusMutation = trpc.drillAssignments.updateStatus.useMutation();

  const allDrills = useAllDrills();

  const athleteOptions = useMemo(() => {
    const options: { id: string; name: string; email: string; type: "user" | "invite"; status?: string }[] = [];
    allUsers.forEach((u: any) => {
      if (u.role !== "admin") {
        options.push({ id: `user-${u.id}`, name: u.name || `User ${u.id}`, email: u.email || "", type: "user" });
      }
    });
    allInvites.forEach((inv: any) => {
      const existingUser = allUsers.find((u: any) => u.email === inv.email);
      if (!existingUser && (inv.status === "pending" || inv.status === "accepted")) {
        options.push({
          id: `invite-${inv.id}`,
          name: inv.email.split("@")[0],
          email: inv.email,
          type: "invite",
          status: inv.status,
        });
      }
    });
    return options;
  }, [allUsers, allInvites]);

  const filteredDrills = useMemo(
    () =>
      (allDrills as Drill[])
        .filter((drill) => drill.name.toLowerCase().includes(searchDrill.toLowerCase()))
        .slice(0, 10),
    [searchDrill, allDrills]
  );

  const userAssignments = useMemo(() => {
    if (!selectedUser) return [];
    if (selectedUser.startsWith("invite-")) {
      const inviteId = parseInt(selectedUser.replace("invite-", ""));
      return allAssignments.filter((a: any) => a.inviteId === inviteId);
    }
    const userId = parseInt(selectedUser.replace("user-", ""));
    return allAssignments.filter((a: any) => a.userId === userId);
  }, [selectedUser, allAssignments]);

  async function handleAssignDrill() {
    if (!selectedUser || !selectedDrill) return;
    try {
      const base = {
        drillId: selectedDrill.id,
        drillName: selectedDrill.name,
        difficulty: selectedDrill.difficulty,
        duration: selectedDrill.duration,
      };
      if (selectedUser.startsWith("invite-")) {
        const inviteId = parseInt(selectedUser.replace("invite-", ""));
        await assignDrillMutation.mutateAsync({ inviteId, ...base });
      } else {
        const userId = parseInt(selectedUser.replace("user-", ""));
        await assignDrillMutation.mutateAsync({ userId, ...base });
      }
      setSelectedDrill(null);
      setSearchDrill("");
    } catch (error) {
      console.error("Failed to assign drill:", error);
    }
  }

  async function handleUnassignDrill(assignmentId: number) {
    try {
      await unassignDrillMutation.mutateAsync({ assignmentId });
      await utils.drillAssignments.getAllAssignments.invalidate();
    } catch (error) {
      console.error("Failed to unassign drill:", error);
    }
  }

  async function handleStatusUpdate(
    assignmentId: number,
    status: "assigned" | "in-progress" | "completed"
  ) {
    try {
      await updateStatusMutation.mutateAsync({ assignmentId, status });
      await utils.drillAssignments.getAllAssignments.invalidate();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  const selectedAthleteName =
    athleteOptions.find((a) => a.id === selectedUser)?.name || "Athlete";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Left: athlete & drill selection */}
      <div className="lg:col-span-1 space-y-4">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 md:p-5 border-b border-white/[0.06]">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#DC143C]/20 to-[#DC143C]/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-[#DC143C]" />
              </div>
              Assign Drill
            </h3>
          </div>

          <div className="p-4 md:p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
                Select Athlete
              </label>
              <Select value={selectedUser || ""} onValueChange={(val) => setSelectedUser(val)}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                  <SelectValue placeholder="Choose athlete..." />
                </SelectTrigger>
                <SelectContent>
                  {athleteOptions.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No athletes found. Invite athletes from User Management.
                    </div>
                  ) : (
                    athleteOptions.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        <div className="flex items-center gap-2">
                          <span>{athlete.name}</span>
                          {athlete.type === "invite" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
                  Search Drill
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type drill name..."
                    value={searchDrill}
                    onChange={(e) => setSearchDrill(e.target.value)}
                    className="pl-9 text-sm bg-white/[0.04] border-white/[0.08]"
                  />
                </div>

                {searchDrill && filteredDrills.length > 0 && (
                  <div className="mt-2 border border-white/[0.08] rounded-lg max-h-48 overflow-y-auto bg-card/80 backdrop-blur-sm">
                    {filteredDrills.map((drill) => (
                      <button
                        key={drill.id}
                        onClick={() => setSelectedDrill(drill)}
                        className={`w-full text-left px-3 py-2.5 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0 ${
                          selectedDrill?.id === drill.id
                            ? "bg-[#DC143C]/10 border-l-2 border-l-[#DC143C]"
                            : ""
                        }`}
                      >
                        <div className="font-medium text-sm">{drill.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {drill.difficulty} · {drill.categories?.join(", ")}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDrill && (
              <div className="bg-gradient-to-br from-[#DC143C]/10 to-purple-500/10 border border-[#DC143C]/20 p-4 rounded-xl">
                <div className="font-semibold text-sm mb-2">{selectedDrill.name}</div>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  <Badge variant="outline" className="text-[10px] border-[#DC143C]/30 text-[#DC143C]">
                    {selectedDrill.difficulty}
                  </Badge>
                  {selectedDrill.categories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-[10px]">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={handleAssignDrill}
                  disabled={assignDrillMutation.isPending}
                  className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white text-sm"
                  size="sm"
                >
                  {assignDrillMutation.isPending ? "Assigning..." : "Assign Drill"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: assignments or progress */}
      <div className="lg:col-span-2">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 md:p-5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg">
              {selectedUser
                ? showProgressReport
                  ? `${selectedAthleteName}'s Progress`
                  : `${selectedAthleteName}'s Assignments`
                : "Select an athlete"}
            </h3>
            {selectedUser && selectedUser.startsWith("user-") && (
              <Button
                variant={showProgressReport ? "default" : "outline"}
                size="sm"
                onClick={() => setShowProgressReport(!showProgressReport)}
                className="gap-2 text-xs"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                {showProgressReport ? "Assignments" : "Progress"}
              </Button>
            )}
          </div>

          <div className="p-4 md:p-5">
            {selectedUser && showProgressReport && selectedUser.startsWith("user-") ? (
              <AthleteProgressReport
                userId={parseInt(selectedUser.replace("user-", ""))}
                athleteName={selectedAthleteName}
              />
            ) : selectedUser && userAssignments.length > 0 ? (
              <div className="space-y-3">
                {userAssignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base mb-2 truncate group-hover:text-[#DC143C] transition-colors">
                          {assignment.drillName}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={`text-[10px] ${
                              assignment.status === "completed"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : assignment.status === "in-progress"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-white/[0.06] text-muted-foreground border-white/[0.1]"
                            }`}
                            variant="outline"
                          >
                            {assignment.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {assignment.status === "in-progress" && <Clock className="h-3 w-3 mr-1" />}
                            {assignment.status === "assigned" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {assignment.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {assignment.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Select
                          value={assignment.status}
                          onValueChange={(status: any) => handleStatusUpdate(assignment.id, status)}
                        >
                          <SelectTrigger className="w-28 text-xs h-8 bg-white/[0.04] border-white/[0.08]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignDrill(assignment.id)}
                          disabled={unassignDrillMutation.isPending}
                          className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedUser ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 opacity-30" />
                </div>
                <p className="font-medium">No drills assigned yet</p>
                <p className="text-sm mt-1">Search and select a drill on the left to assign.</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 opacity-30" />
                </div>
                <p className="font-medium">Choose an athlete</p>
                <p className="text-sm mt-1">Pick someone from the dropdown to see or assign drills.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
