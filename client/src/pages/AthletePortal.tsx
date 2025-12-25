import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, AlertCircle, Play, ArrowRight, Home } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import drillsData from "@/data/drills.json";
import { getCategoryConfig } from "@/lib/categoryColors";
import { trpc } from "@/lib/trpc";

interface Drill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  skillSet?: string;
  url?: string;
  is_direct_link?: boolean;
}

interface Assignment {
  id: number;
  userId: number;
  drillId: string;
  drillName: string;
  status: "assigned" | "in-progress" | "completed";
  notes: string | null;
  assignedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

export default function AthletePortal() {
  const { user, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "in-progress" | "completed">("all");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Fetch user's assignments
  const { data: userAssignments = [], isLoading: assignmentsLoading } = trpc.drillAssignments.getUserAssignments.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Update status mutation
  const updateStatusMutation = trpc.drillAssignments.updateStatus.useMutation();

  // Filter assignments by status
  const filteredAssignments = useMemo(() => {
    if (statusFilter === "all") return userAssignments;
    return userAssignments.filter((a: any) => a.status === statusFilter);
  }, [userAssignments, statusFilter]);

  // Get drill details
  const getDrill = (drillId: string): Drill | undefined => {
    return (drillsData as Drill[]).find(d => d.id === drillId);
  };

  // Handle status update
  const handleStatusUpdate = async (assignmentId: number, newStatus: "assigned" | "in-progress" | "completed") => {
    try {
      await updateStatusMutation.mutateAsync({ assignmentId, status: newStatus });
      if (selectedAssignment?.id === assignmentId) {
        setSelectedAssignment({ ...selectedAssignment, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Get status badge config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { icon: CheckCircle, label: "Completed", variant: "default" as const };
      case "in-progress":
        return { icon: Clock, label: "In Progress", variant: "secondary" as const };
      case "assigned":
        return { icon: AlertCircle, label: "Assigned", variant: "outline" as const };
      default:
        return { icon: AlertCircle, label: "Unknown", variant: "outline" as const };
    }
  };

  if (loading || assignmentsLoading) {
    return <div className="container py-12 text-center">Loading your drills...</div>;
  }

  if (!user) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto border-2">
          <CardHeader className="text-center">
            <CardTitle>Please Log In</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">You need to be logged in to view your assigned drills.</p>
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
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8 mb-8">
        <div className="container">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4 pl-0">
              <Home className="mr-2 h-4 w-4" />
              Back to Directory
            </Button>
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-heading font-black">Your Drills</h1>
            <p className="text-primary-foreground/90">Welcome, {user.name}! Here are your assigned drills and progress.</p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Assignments List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Assignments</CardTitle>
                  <Badge variant="secondary">{filteredAssignments.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Status Filter */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Filter by Status</label>
                  <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Drills</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignments Grid */}
                {filteredAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAssignments.map((assignment: any) => {
                      const drill = getDrill(assignment.drillId);
                      const statusConfig = getStatusConfig(assignment.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div
                          key={assignment.id}
                          onClick={() => setSelectedAssignment(assignment)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            selectedAssignment?.id === assignment.id ? "border-secondary bg-secondary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{assignment.drillName}</h3>
                              {drill && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">{drill.difficulty}</Badge>
                                  {drill.categories.slice(0, 2).map(cat => {
                                    const config = getCategoryConfig(cat);
                                    return (
                                      <Badge
                                        key={cat}
                                        className={`text-xs ${config.color} ${config.bgColor}`}
                                      >
                                        {cat}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant={statusConfig.variant as any}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No drills assigned yet</p>
                    <p className="text-sm">Check back soon for new drills from your coach!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Drill Details */}
          <div className="lg:col-span-1">
            {selectedAssignment ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Drill Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const drill = getDrill(selectedAssignment.drillId);
                    return (
                      <>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{selectedAssignment.drillName}</h3>
                          {drill && (
                            <>
                              <div className="space-y-2 mb-4">
                                <div>
                                  <span className="text-xs font-semibold text-muted-foreground uppercase">Duration</span>
                                  <p className="text-sm">{drill.duration}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-muted-foreground uppercase">Difficulty</span>
                                  <p className="text-sm">{drill.difficulty}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-muted-foreground uppercase">Skill Set</span>
                                  <p className="text-sm">{drill.skillSet}</p>
                                </div>
                              </div>

                              {/* Drill Video Link */}
                              <Link href={`/drill/${drill.id}`}>
                                <Button className="w-full mb-4" variant="secondary">
                                  <Play className="h-4 w-4 mr-2" />
                                  View Full Drill
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>

                        {/* Coach Notes */}
                        {selectedAssignment.notes && (
                          <div className="bg-muted p-3 rounded-lg">
                            <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Coach Notes</span>
                            <p className="text-sm">{selectedAssignment.notes}</p>
                          </div>
                        )}

                        {/* Status Update */}
                        <div className="border-t pt-4">
                          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Update Status</label>
                          <Select
                            value={selectedAssignment.status}
                            onValueChange={(status: any) => handleStatusUpdate(selectedAssignment.id, status)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="assigned">Assigned</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Completion Date */}
                        {selectedAssignment.status === "completed" && selectedAssignment.completedAt && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Completed {new Date(selectedAssignment.completedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p>Select a drill to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
