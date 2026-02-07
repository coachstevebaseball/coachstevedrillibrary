import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, AlertCircle, Search, Sparkles, Video, Upload, MessageSquare, BarChart3, Activity, Users, LayoutTemplate, Edit3 } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import drillsData from "@/data/drills.json";
import { trpc } from "@/lib/trpc";

// Hook to merge static drills with custom drills from database
function useAllDrills() {
  const { data: customDrills = [] } = trpc.drillDetails.getCustomDrills.useQuery();
  return useMemo(() => {
    const customDrillsFormatted = customDrills.map((cd: any) => ({
      id: cd.drillId,
      name: cd.name,
      difficulty: cd.difficulty,
      categories: [cd.category],
      duration: cd.duration,
    }));
    return [...drillsData, ...customDrillsFormatted];
  }, [customDrills]);
}
import { BulkInstructionImport } from "@/components/BulkInstructionImport";
import { BulkGoalUpload } from "@/components/BulkGoalUpload";
import { AthleteProgressReport } from "@/components/AthleteProgressReport";
import { AthleteAssignmentOverview } from "@/components/AthleteAssignmentOverview";
import { DrillPageBuilderNotion } from "@/components/DrillPageBuilderNotion";

interface Drill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
}

export default function CoachDashboard() {
  const { user, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string | null>(null); // Can be "user-{id}" or "invite-{id}"
  const [searchDrill, setSearchDrill] = useState("");
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "assign" | "bulk-import" | "bulk-goals" | "page-layouts">("overview");
  const [editingLayoutDrill, setEditingLayoutDrill] = useState<{ id: string; name: string } | null>(null);
  const [layoutSearchQuery, setLayoutSearchQuery] = useState("");
  const [isBulkGoalOpen, setIsBulkGoalOpen] = useState(false);
  const [showProgressReport, setShowProgressReport] = useState(false);
  
  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // Fetch all users
  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Fetch all invites to show pending athletes
  const { data: allInvites = [] } = trpc.invites.getAllInvites.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Combine users and pending invites for athlete selection
  const athleteOptions = useMemo(() => {
    const options: { id: string; name: string; email: string; type: 'user' | 'invite'; status?: string }[] = [];
    
    // Add existing users (excluding admin)
    allUsers.forEach((u: any) => {
      if (u.role !== 'admin') {
        options.push({
          id: `user-${u.id}`,
          name: u.name || `User ${u.id}`,
          email: u.email || '',
          type: 'user'
        });
      }
    });
    
    // Add pending invites that haven't been accepted yet
    allInvites.forEach((inv: any) => {
      if (inv.status === 'pending') {
        // Check if this email already exists as a user
        const existingUser = allUsers.find((u: any) => u.email === inv.email);
        if (!existingUser) {
          options.push({
            id: `invite-${inv.id}`,
            name: inv.email.split('@')[0],
            email: inv.email,
            type: 'invite',
            status: 'pending'
          });
        }
      }
      // Also add accepted invites that don't have a user yet
      if (inv.status === 'accepted') {
        const existingUser = allUsers.find((u: any) => u.email === inv.email);
        if (!existingUser) {
          options.push({
            id: `invite-${inv.id}`,
            name: inv.email.split('@')[0],
            email: inv.email,
            type: 'invite',
            status: 'accepted'
          });
        }
      }
    });
    
    return options;
  }, [allUsers, allInvites]);

  // Fetch all assignments
  const { data: allAssignments = [] } = trpc.drillAssignments.getAllAssignments.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Mutations
  const assignDrillMutation = trpc.drillAssignments.assignDrill.useMutation();
  const unassignDrillMutation = trpc.drillAssignments.unassignDrill.useMutation();
  const updateStatusMutation = trpc.drillAssignments.updateStatus.useMutation();

  // Get all drills including custom drills
  const allDrills = useAllDrills();

  // Filter drills by search
  const filteredDrills = useMemo(() => {
    return (allDrills as Drill[]).filter(drill =>
      drill.name.toLowerCase().includes(searchDrill.toLowerCase())
    ).slice(0, 10); // Show top 10 results
  }, [searchDrill, allDrills]);

  // Get user/invite assignments
  const userAssignments = useMemo(() => {
    if (!selectedUser) return [];
    if (selectedUser.startsWith('invite-')) {
      const inviteId = parseInt(selectedUser.replace('invite-', ''));
      return allAssignments.filter((a: any) => a.inviteId === inviteId);
    } else {
      const userId = parseInt(selectedUser.replace('user-', ''));
      return allAssignments.filter((a: any) => a.userId === userId);
    }
  }, [selectedUser, allAssignments]);

  // Handle assign drill
  const handleAssignDrill = async () => {
    if (!selectedUser || !selectedDrill) return;

    try {
      if (selectedUser.startsWith('invite-')) {
        const inviteId = parseInt(selectedUser.replace('invite-', ''));
        await assignDrillMutation.mutateAsync({
          inviteId,
          drillId: selectedDrill.id,
          drillName: selectedDrill.name,
          difficulty: selectedDrill.difficulty,
          duration: selectedDrill.duration,
        });
      } else {
        const userId = parseInt(selectedUser.replace('user-', ''));
        await assignDrillMutation.mutateAsync({
          userId,
          drillId: selectedDrill.id,
          drillName: selectedDrill.name,
          difficulty: selectedDrill.difficulty,
          duration: selectedDrill.duration,
        });
      }
      setSelectedDrill(null);
      setSearchDrill("");
    } catch (error) {
      console.error("Failed to assign drill:", error);
    }
  };

  // Handle unassign drill
  const handleUnassignDrill = async (assignmentId: number) => {
    try {
      await unassignDrillMutation.mutateAsync({ assignmentId });
      // Invalidate the assignments query to refresh the UI
      await utils.drillAssignments.getAllAssignments.invalidate();
    } catch (error) {
      console.error("Failed to unassign drill:", error);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (assignmentId: number, status: "assigned" | "in-progress" | "completed") => {
    try {
      await updateStatusMutation.mutateAsync({ assignmentId, status });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  if (loading) {
    return <div className="container py-12 text-center">Loading...</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto border-2">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Only coaches (admins) can access the drill assignment dashboard.</p>
            <Link href="/">
              <Button variant="outline">Back to Directory</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 md:py-8 mb-6 md:mb-8">
        <div className="container px-3 md:px-4">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-3 md:mb-4 pl-0 text-sm md:text-base">
              <ArrowLeft className="mr-2 h-3 md:h-4 w-3 md:w-4" />
              <span className="hidden sm:inline">Back to Directory</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl md:text-5xl font-heading font-black">Coach Dashboard</h1>
              <p className="text-primary-foreground/90 mt-1 md:mt-2 text-sm md:text-base">Assign drills to athletes and track progress</p>
            </div>
            <div className="flex gap-2 flex-wrap w-full md:w-auto">
              <Link href="/submissions" className="flex-1 md:flex-none">
                <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap w-full md:w-auto text-xs md:text-sm">
                  <MessageSquare className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Submissions</span>
                  <span className="sm:hidden">Subs</span>
                </Button>
              </Link>
              <Link href="/coach-messaging" className="flex-1 md:flex-none">
                <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap w-full md:w-auto text-xs md:text-sm">
                  <MessageSquare className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Messages</span>
                  <span className="sm:hidden">Msgs</span>
                </Button>
              </Link>
              <Link href="/activity-feed" className="flex-1 md:flex-none">
                <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap w-full md:w-auto text-xs md:text-sm">
                  <Activity className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Activity Feed</span>
                  <span className="sm:hidden">Activity</span>
                </Button>
              </Link>
              <Link href="/manage-drill-videos" className="flex-1 md:flex-none">
                <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap w-full md:w-auto text-xs md:text-sm">
                  <Video className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Manage Videos</span>
                  <span className="sm:hidden">Videos</span>
                </Button>
              </Link>
              <Link href="/create-drill-details" className="flex-1 md:flex-none">
                <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap w-full md:w-auto text-xs md:text-sm">
                  <Sparkles className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Create Details</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </Link>
              <Link href="/drill-generator" className="flex-1 md:flex-none">
                <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap w-full md:w-auto text-xs md:text-sm">
                  <Sparkles className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">AI Generator</span>
                  <span className="sm:hidden">AI</span>
                </Button>
              </Link>
              <Button
                onClick={() => setActiveTab(activeTab === "assign" ? "bulk-import" : "assign")}
                className="bg-white text-primary hover:bg-white/90 whitespace-nowrap w-full md:w-auto text-xs md:text-sm flex-1 md:flex-none"
              >
                <Upload className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
                <span className="hidden sm:inline">Bulk Import</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                onClick={() => setIsBulkGoalOpen(true)}
                className="bg-white text-primary hover:bg-white/90 whitespace-nowrap w-full md:w-auto text-xs md:text-sm flex-1 md:flex-none"
              >
                <Upload className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
                <span className="hidden sm:inline">Bulk Goals</span>
                <span className="sm:hidden">Goals</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="container max-w-6xl px-3 md:px-4 pt-4">
        <div className="flex gap-2 border-b border-border pb-3">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Athlete Overview</span>
            <span className="sm:hidden">Overview</span>
          </Button>
          <Button
            variant={activeTab === "assign" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("assign")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Assign Drills</span>
            <span className="sm:hidden">Assign</span>
          </Button>
          <Button
            variant={activeTab === "page-layouts" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("page-layouts")}
            className="gap-2"
          >
            <LayoutTemplate className="h-4 w-4" />
            <span className="hidden sm:inline">Page Layouts</span>
            <span className="sm:hidden">Layouts</span>
          </Button>
        </div>
      </div>

      <main className="container max-w-6xl pb-8 md:pb-12 px-3 md:px-4 pt-4">
        <BulkGoalUpload isOpen={isBulkGoalOpen} onClose={() => setIsBulkGoalOpen(false)} />
        {activeTab === "overview" ? (
          <AthleteAssignmentOverview 
            onSelectAthlete={(athleteId) => {
              setSelectedUser(athleteId);
              setActiveTab("assign");
            }} 
          />
        ) : activeTab === "page-layouts" ? (
          <div className="space-y-6">
            {editingLayoutDrill ? (
              <DrillPageBuilderNotion
                drillId={editingLayoutDrill.id}
                drillName={editingLayoutDrill.name}
                onClose={() => setEditingLayoutDrill(null)}
              />
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-2xl font-heading font-bold">Drill Page Layouts</h2>
                    <p className="text-muted-foreground mt-1">Pick a drill to create or edit its page layout with the block editor.</p>
                  </div>
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search drills..."
                      value={layoutSearchQuery}
                      onChange={(e) => setLayoutSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allDrills
                    .filter((d) => d.name.toLowerCase().includes(layoutSearchQuery.toLowerCase()))
                    .map((drill) => (
                      <Card
                        key={drill.id}
                        className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-secondary/50"
                        onClick={() => setEditingLayoutDrill({ id: String(drill.id), name: drill.name })}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-electric-blue/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Edit3 className="h-5 w-5 text-electric-blue" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{drill.name}</p>
                            <p className="text-xs text-muted-foreground">{drill.difficulty} · {drill.categories?.join(", ")}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
                {allDrills.filter((d) => d.name.toLowerCase().includes(layoutSearchQuery.toLowerCase())).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No drills found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : activeTab === "bulk-import" ? (
          <div className="max-w-4xl mx-auto">
            <BulkInstructionImport />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left: User Selection & Drill Assignment */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Plus className="h-4 md:h-5 w-4 md:w-5 text-secondary" />
                  Assign Drill
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {/* User Selection */}
                <div>
                  <label className="text-xs md:text-sm font-semibold text-muted-foreground mb-1.5 md:mb-2 block">Select Athlete</label>
                  <Select value={selectedUser || ""} onValueChange={(val) => setSelectedUser(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose athlete..." />
                    </SelectTrigger>
                    <SelectContent>
                      {athleteOptions.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No athletes found. Invite athletes from Admin Dashboard.
                        </div>
                      ) : (
                        athleteOptions.map((athlete) => (
                          <SelectItem 
                            key={athlete.id} 
                            value={athlete.id}
                          >
                            <div className="flex items-center gap-2">
                              <span>{athlete.name}</span>
                              {athlete.type === 'invite' && (
                                <Badge variant="outline" className="text-xs">Pending Invite</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Drill Search */}
                {selectedUser && (
                  <div>
                    <label className="text-xs md:text-sm font-semibold text-muted-foreground mb-1.5 md:mb-2 block">Search Drill</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
                      <Input
                        placeholder="Type drill name..."
                        value={searchDrill}
                        onChange={(e) => setSearchDrill(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>

                    {/* Drill Results */}
                    {searchDrill && filteredDrills.length > 0 && (
                      <div className="mt-2 border rounded-lg max-h-40 md:max-h-48 overflow-y-auto">
                        {filteredDrills.map(drill => (
                          <button
                            key={drill.id}
                            onClick={() => setSelectedDrill(drill)}
                            className={`w-full text-left p-1.5 md:p-2 hover:bg-muted transition-colors border-b last:border-b-0 ${
                              selectedDrill?.id === drill.id ? "bg-secondary/20" : ""
                            }`}
                          >
                            <div className="font-medium text-xs md:text-sm">{drill.name}</div>
                            <div className="text-xs text-muted-foreground">{drill.difficulty}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Drill */}
                {selectedDrill && (
                  <div className="bg-muted p-2.5 md:p-3 rounded-lg">
                    <div className="font-semibold text-xs md:text-sm mb-2">{selectedDrill.name}</div>
                    <div className="flex gap-1.5 md:gap-2 flex-wrap mb-2.5 md:mb-3">
                      <Badge variant="outline" className="text-xs">{selectedDrill.difficulty}</Badge>
                      {selectedDrill.categories.map(cat => (
                        <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                      ))}
                    </div>
                    <Button
                      onClick={handleAssignDrill}
                      disabled={assignDrillMutation.isPending}
                      className="w-full text-sm"
                      size="sm"
                    >
                      {assignDrillMutation.isPending ? "Assigning..." : "Assign Drill"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Assignments List or Progress Report */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg md:text-xl">
                    {selectedUser
                      ? showProgressReport
                        ? `${athleteOptions.find(a => a.id === selectedUser)?.name || 'Athlete'}'s Progress Report`
                        : `${athleteOptions.find(a => a.id === selectedUser)?.name || 'Athlete'}'s Assignments`
                      : "Select an athlete to view assignments"}
                  </CardTitle>
                  {selectedUser && selectedUser.startsWith('user-') && (
                    <Button
                      variant={showProgressReport ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowProgressReport(!showProgressReport)}
                      className="gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      {showProgressReport ? "View Assignments" : "Progress Report"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedUser && showProgressReport && selectedUser.startsWith('user-') ? (
                  <AthleteProgressReport
                    userId={parseInt(selectedUser.replace('user-', ''))}
                    athleteName={athleteOptions.find(a => a.id === selectedUser)?.name || 'Athlete'}
                  />
                ) : selectedUser && userAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {userAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{assignment.drillName}</h3>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge
                                variant={
                                  assignment.status === "completed"
                                    ? "default"
                                    : assignment.status === "in-progress"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {assignment.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                                {assignment.status === "in-progress" && <Clock className="h-3 w-3 mr-1" />}
                                {assignment.status === "assigned" && <AlertCircle className="h-3 w-3 mr-1" />}
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {assignment.notes && (
                              <p className="text-sm text-muted-foreground mb-2">Notes: {assignment.notes}</p>
                            )}
                          </div>

                          {/* Status Controls */}
                          <div className="flex flex-col gap-2">
                            <Select
                              value={assignment.status}
                              onValueChange={(status: any) => handleStatusUpdate(assignment.id, status)}
                            >
                              <SelectTrigger className="w-32 text-sm">
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
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedUser ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No drills assigned yet. Select a drill on the left to assign.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Select an athlete to view their assignments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
