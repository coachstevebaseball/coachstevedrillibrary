import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, AlertCircle, Search, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import drillsData from "@/data/drills.json";
import { trpc } from "@/lib/trpc";

interface Drill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
}

export default function CoachDashboard() {
  const { user, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [searchDrill, setSearchDrill] = useState("");
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);

  // Fetch all users
  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Fetch all assignments
  const { data: allAssignments = [] } = trpc.drillAssignments.getAllAssignments.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Mutations
  const assignDrillMutation = trpc.drillAssignments.assignDrill.useMutation();
  const unassignDrillMutation = trpc.drillAssignments.unassignDrill.useMutation();
  const updateStatusMutation = trpc.drillAssignments.updateStatus.useMutation();

  // Filter drills by search
  const filteredDrills = useMemo(() => {
    return (drillsData as Drill[]).filter(drill =>
      drill.name.toLowerCase().includes(searchDrill.toLowerCase())
    ).slice(0, 10); // Show top 10 results
  }, [searchDrill]);

  // Get user assignments
  const userAssignments = useMemo(() => {
    if (!selectedUser) return [];
    return allAssignments.filter((a: any) => a.userId === selectedUser);
  }, [selectedUser, allAssignments]);

  // Handle assign drill
  const handleAssignDrill = async () => {
    if (!selectedUser || !selectedDrill) return;

    try {
      await assignDrillMutation.mutateAsync({
        userId: selectedUser,
        drillId: selectedDrill.id,
        drillName: selectedDrill.name,
      });
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
      <header className="bg-primary text-primary-foreground py-8 mb-8">
        <div className="container">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4 pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Button>
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-black">Coach Dashboard</h1>
              <p className="text-primary-foreground/90 mt-2">Assign drills to athletes and track progress</p>
            </div>
            <Link href="/drill-generator">
              <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Generator
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: User Selection & Drill Assignment */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-secondary" />
                  Assign Drill
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Selection */}
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Select Athlete</label>
                  <Select value={selectedUser?.toString() || ""} onValueChange={(val) => setSelectedUser(parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose athlete..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.name || `User ${u.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Drill Search */}
                {selectedUser && (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-2 block">Search Drill</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Type drill name..."
                        value={searchDrill}
                        onChange={(e) => setSearchDrill(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Drill Results */}
                    {searchDrill && filteredDrills.length > 0 && (
                      <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                        {filteredDrills.map(drill => (
                          <button
                            key={drill.id}
                            onClick={() => setSelectedDrill(drill)}
                            className={`w-full text-left p-2 hover:bg-muted transition-colors border-b last:border-b-0 ${
                              selectedDrill?.id === drill.id ? "bg-secondary/20" : ""
                            }`}
                          >
                            <div className="font-medium text-sm">{drill.name}</div>
                            <div className="text-xs text-muted-foreground">{drill.difficulty}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Drill */}
                {selectedDrill && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{selectedDrill.name}</div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <Badge variant="outline">{selectedDrill.difficulty}</Badge>
                      {selectedDrill.categories.map(cat => (
                        <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                      ))}
                    </div>
                    <Button
                      onClick={handleAssignDrill}
                      disabled={assignDrillMutation.isPending}
                      className="w-full"
                    >
                      {assignDrillMutation.isPending ? "Assigning..." : "Assign Drill"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Assignments List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedUser
                    ? `${allUsers.find((u: any) => u.id === selectedUser)?.name || `User ${selectedUser}`}'s Assignments`
                    : "Select an athlete to view assignments"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUser && userAssignments.length > 0 ? (
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
      </main>
    </div>
  );
}
