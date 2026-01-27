import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CheckCircle, Clock, AlertCircle, Play, ArrowRight, Home, LogOut, 
  MessageCircle, Star, Flame, Target, ChevronRight, X, Trophy
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo, useEffect } from "react";
import drillsData from "@/data/drills.json";
import { getCategoryConfig } from "@/lib/categoryColors";
import { trpc } from "@/lib/trpc";
import { CompletionModal } from "@/components/CompletionModal";
import { DrillSubmissionForm } from "@/components/DrillSubmissionForm";

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
  userId: number | null;
  inviteId?: number | null;
  drillId: string;
  drillName: string;
  status: "assigned" | "in-progress" | "completed";
  notes: string | null;
  assignedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

// Circular Progress Component
function CircularProgress({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-orange-500 transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{percentage}%</span>
      </div>
    </div>
  );
}

// Skill Icon Component
function SkillIcon({ category }: { category: string }) {
  const config = getCategoryConfig(category);
  return (
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bgColor}`}>
      <Target className={`w-6 h-6 ${config.color}`} />
    </div>
  );
}

export default function AthletePortal() {
  const { user, loading, logout } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Fetch user's assignments
  const { data: userAssignments = [], isLoading: assignmentsLoading } = trpc.drillAssignments.getUserAssignments.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch user's streak
  const { data: streak = 0 } = trpc.drillAssignments.getStreak.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch user's favorite drills
  const { data: favoritesData } = trpc.favorites.getAll.useQuery(
    undefined,
    { enabled: !!user?.id }
  );
  const favoriteIds = favoritesData?.drillIds || [];

  // Toggle favorite mutation
  const utils = trpc.useUtils();
  const toggleFavorite = trpc.favorites.toggle.useMutation({
    onSuccess: () => {
      utils.favorites.getAll.invalidate();
    },
  });

  // Update status mutation
  const updateStatusMutation = trpc.drillAssignments.updateStatus.useMutation({
    onSuccess: () => {
      utils.drillAssignments.getUserAssignments.invalidate();
    },
  });

  // Activity logging mutation
  const logActivityMutation = trpc.activity.logActivity.useMutation();

  // Log portal login on mount
  useEffect(() => {
    if (user?.id) {
      logActivityMutation.mutate({ activityType: "portal_login" });
    }
  }, [user?.id]);

  // Calculate progress stats
  const progressStats = useMemo(() => {
    const total = userAssignments.length;
    const completed = userAssignments.filter((a: any) => a.status === "completed").length;
    const inProgress = userAssignments.filter((a: any) => a.status === "in-progress").length;
    const assigned = userAssignments.filter((a: any) => a.status === "assigned").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, assigned, streak, percentage };
  }, [userAssignments, streak]);

  // Get the most urgent drill (first assigned, then in-progress)
  const upNextDrill = useMemo(() => {
    const assignedDrills = userAssignments.filter((a: any) => a.status === "assigned");
    const inProgressDrills = userAssignments.filter((a: any) => a.status === "in-progress");
    return inProgressDrills[0] || assignedDrills[0] || null;
  }, [userAssignments]);

  // Get pending assignments (not completed)
  const pendingAssignments = useMemo(() => {
    return userAssignments.filter((a: any) => a.status !== "completed");
  }, [userAssignments]);

  // Get completed assignments
  const completedAssignments = useMemo(() => {
    return userAssignments.filter((a: any) => a.status === "completed");
  }, [userAssignments]);

  // Get all drills including custom drills
  const allDrills = useAllDrills();

  // Get drill details
  const getDrill = (drillId: string): Drill | undefined => {
    return (allDrills as Drill[]).find(d => d.id === drillId);
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

  // Open drill modal
  const openDrillModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDrillModal(true);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "bg-green-100 text-green-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "hard": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading || assignmentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your training...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Please Log In</h2>
            <p className="text-gray-600">You need to be logged in to view your training.</p>
            <Link href="/">
              <Button variant="outline" className="w-full">Back to Directory</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is an active athlete
  if (user?.role === 'athlete' && !user?.isActiveClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Account Inactive</h2>
            <p className="text-gray-600">Your account has been deactivated. Please contact your coach.</p>
            <Button onClick={() => logout()} variant="outline" className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <header className="bg-primary text-white px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href="/">
            <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Directory</span>
            </button>
          </Link>
          <h1 className="font-bold text-lg">My Training</h1>
          <Link href="/athlete-messaging">
            <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Up Next Hero Card */}
        {upNextDrill ? (
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white/80 uppercase tracking-wide">Up Next</span>
              </div>
              
              <h2 className="text-2xl font-bold mb-3">{upNextDrill.drillName}</h2>
              
              {(() => {
                const drill = getDrill(upNextDrill.drillId);
                return drill && (
                  <div className="flex items-center gap-3 mb-5">
                    <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                      <Clock className="w-3 h-3 mr-1" />
                      {drill.duration || "10 min"}
                    </Badge>
                    <Badge className={`border-0 ${getDifficultyColor(drill.difficulty)}`}>
                      {drill.difficulty}
                    </Badge>
                    {drill.categories[0] && (
                      <Badge className="bg-white/20 text-white border-0">
                        {drill.categories[0]}
                      </Badge>
                    )}
                  </div>
                );
              })()}

              <Button 
                onClick={() => openDrillModal(upNextDrill)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 text-lg shadow-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Let's Go!
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
              <p className="text-white/80">No pending drills. Check back soon for new assignments!</p>
            </CardContent>
          </Card>
        )}

        {/* Compact Progress Row */}
        <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm">
          {/* Circular Progress */}
          <CircularProgress percentage={progressStats.percentage} />
          
          {/* Stats */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{progressStats.completed}/{progressStats.total} done</span>
            </div>
            
            {/* Streak */}
            <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-orange-600">{progressStats.streak}</span>
              <span className="text-sm text-orange-600">Day Streak</span>
              {progressStats.streak > 0 && <span className="text-lg">🔥</span>}
            </div>
          </div>
        </div>

        {/* Pending Drills Playlist */}
        {pendingAssignments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Your Playlist</h3>
              <Badge variant="secondary" className="bg-gray-100">
                {pendingAssignments.length} remaining
              </Badge>
            </div>
            
            <div className="space-y-2">
              {pendingAssignments.map((assignment: any) => {
                const drill = getDrill(assignment.drillId);
                const isInProgress = assignment.status === "in-progress";
                
                return (
                  <button
                    key={assignment.id}
                    onClick={() => openDrillModal(assignment)}
                    className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
                  >
                    {/* Skill Icon */}
                    <SkillIcon category={drill?.categories[0] || "General"} />
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{assignment.drillName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {isInProgress && (
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                            In Progress
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Play Arrow */}
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Play className="w-5 h-5 text-orange-600 ml-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* My Favorites Section */}
        {favoriteIds.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                My Favorites
              </h3>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                {favoriteIds.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {favoriteIds.map((drillId: number) => {
                // Try to find drill by numeric ID first, then by string ID
                let drill = allDrills.find((d: any) => d.id === drillId || d.id === String(drillId));
                if (!drill) {
                  // Also try matching by converting drill.id to number
                  drill = allDrills.find((d: any) => parseInt(d.id) === drillId);
                }
                
                // If still not found, create a placeholder
                const drillName = drill?.name || `Drill #${drillId}`;
                const drillDifficulty = drill?.difficulty || "Medium";
                const drillCategory = drill?.categories?.[0] || "General";
                
                return (
                  <Link key={drillId} href={`/drill/${drill?.id || drillId}`}>
                    <div className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                      {/* Skill Icon */}
                      <SkillIcon category={drillCategory} />
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{drillName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getDifficultyColor(drillDifficulty)}`}>
                            {drillDifficulty}
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-600 text-xs">
                            {drillCategory}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Star Icon */}
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Drills */}
        {completedAssignments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Completed
              </h3>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {completedAssignments.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {completedAssignments.slice(0, 3).map((assignment: any) => {
                const drill = getDrill(assignment.drillId);
                
                return (
                  <div
                    key={assignment.id}
                    className="bg-white/60 rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-700 truncate">{assignment.drillName}</h4>
                      <span className="text-xs text-gray-500">
                        Completed {assignment.completedAt ? new Date(assignment.completedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Next Badge Progress */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Next Badge</span>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-0">
                {Math.max(0, 5 - progressStats.completed)} more
              </Badge>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (progressStats.completed / 5) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">Complete 5 drills to earn "Dedicated Athlete" badge</p>
          </CardContent>
        </Card>
      </main>

      {/* Drill Focus Modal */}
      <Dialog open={showDrillModal} onOpenChange={setShowDrillModal}>
        <DialogContent className="max-w-lg mx-auto h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b bg-primary text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold pr-8">
                {selectedAssignment?.drillName}
              </DialogTitle>
              <button 
                onClick={() => setShowDrillModal(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedAssignment && (() => {
              const drill = getDrill(selectedAssignment.drillId);
              return (
                <>
                  {/* Drill Info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {drill && (
                      <>
                        <Badge className="bg-gray-100 text-gray-700 border-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {drill.duration || "10 min"}
                        </Badge>
                        <Badge className={`border-0 ${getDifficultyColor(drill.difficulty)}`}>
                          {drill.difficulty}
                        </Badge>
                        {drill.categories[0] && (
                          <Badge className="bg-blue-100 text-blue-700 border-0">
                            {drill.categories[0]}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>

                  {/* Video Link */}
                  <Link href={`/drill/${selectedAssignment.drillId}`}>
                    <Button className="w-full bg-primary hover:bg-primary/90 gap-2">
                      <Play className="w-4 h-4" />
                      Watch Video Instructions
                    </Button>
                  </Link>

                  {/* Submission Form */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-3">Submit Your Work</h3>
                    <DrillSubmissionForm
                      assignmentId={selectedAssignment.id}
                      drillId={selectedAssignment.drillId}
                      onSubmitSuccess={() => {
                        utils.drillAssignments.getUserAssignments.invalidate();
                      }}
                    />
                  </div>

                  {/* Mark Complete Button */}
                  {selectedAssignment.status !== "completed" && (
                    <Button
                      onClick={() => setShowCompletionModal(true)}
                      className="w-full bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Complete
                    </Button>
                  )}

                  {/* Already Completed */}
                  {selectedAssignment.status === "completed" && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-700">Drill Completed!</p>
                      {selectedAssignment.completedAt && (
                        <p className="text-sm text-green-600">
                          {new Date(selectedAssignment.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Modal */}
      {selectedAssignment && (
        <CompletionModal
          isOpen={showCompletionModal}
          drillName={selectedAssignment.drillName}
          onClose={() => setShowCompletionModal(false)}
          onConfirm={() => {
            handleStatusUpdate(selectedAssignment.id, "completed");
            setShowCompletionModal(false);
            setShowDrillModal(false);
          }}
        />
      )}
    </div>
  );
}
