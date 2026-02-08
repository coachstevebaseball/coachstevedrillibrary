import { useState, useMemo, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, FileText, TrendingUp, Target, Clock, CheckCircle2,
  AlertCircle, BarChart3, Calendar, Award, Flame, Download,
  ChevronRight, User, Activity
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function StatCard({ icon, label, value, subtitle, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-heading font-bold mt-1 ${color || "text-foreground"}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, max, label, color }: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max} ({pct}%)</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WeeklyChart({ data }: { data: Array<{ week: string; completed: number }> }) {
  const maxVal = Math.max(...data.map((d) => d.completed), 1);
  return (
    <div className="flex items-end gap-3 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-foreground">{d.completed}</span>
          <div className="w-full bg-muted rounded-t-md overflow-hidden" style={{ height: "100%" }}>
            <div
              className="w-full bg-secondary rounded-t-md transition-all duration-500"
              style={{
                height: `${(d.completed / maxVal) * 100}%`,
                marginTop: `${100 - (d.completed / maxVal) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.week}</span>
        </div>
      ))}
    </div>
  );
}

function AssessmentReport({ athleteId, athleteName }: { athleteId: number; athleteName: string }) {
  const { data: progress, isLoading } = trpc.drillAssignments.getAthleteProgress.useQuery({ userId: athleteId });
  const { data: coachNotes } = trpc.drillAssignments.getCoachNotes.useQuery({ athleteId });
  const reportRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-secondary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-heading font-bold">No Data Available</h3>
        <p className="text-muted-foreground">No progress data found for this athlete.</p>
      </div>
    );
  }

  const { coreMetrics, activity, assignments } = progress;

  // Calculate category breakdown from assignments
  const categoryBreakdown: Record<string, { total: number; completed: number }> = {};
  // We'll use drillName to infer categories - this is approximate
  assignments.forEach((a: any) => {
    const cat = "Assigned Drills";
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, completed: 0 };
    categoryBreakdown[cat].total++;
    if (a.status === "completed") categoryBreakdown[cat].completed++;
  });

  // Determine engagement level
  const getEngagementLevel = () => {
    if (coreMetrics.completionRate >= 80) return { level: "Highly Engaged", color: "text-green-500", badge: "bg-green-900/30 text-green-400 border-green-800" };
    if (coreMetrics.completionRate >= 50) return { level: "Moderately Engaged", color: "text-yellow-500", badge: "bg-yellow-900/30 text-yellow-400 border-yellow-800" };
    if (coreMetrics.completionRate >= 25) return { level: "Needs Encouragement", color: "text-orange-500", badge: "bg-orange-900/30 text-orange-400 border-orange-800" };
    return { level: "At Risk", color: "text-red-500", badge: "bg-red-900/30 text-red-400 border-red-800" };
  };

  const engagement = getEngagementLevel();

  // Generate recommendations
  const recommendations: string[] = [];
  if (coreMetrics.completionRate < 50) {
    recommendations.push("Consider reducing the number of assigned drills to avoid overwhelming the athlete.");
  }
  if (coreMetrics.inProgress > 3) {
    recommendations.push("Multiple drills are in-progress. Encourage the athlete to complete current drills before starting new ones.");
  }
  if (coreMetrics.avgDaysToComplete > 7) {
    recommendations.push("Average completion time is over a week. Consider setting shorter deadlines or breaking drills into smaller sessions.");
  }
  if (coreMetrics.completionRate >= 80) {
    recommendations.push("Excellent completion rate! Consider increasing difficulty or adding more advanced drills.");
  }
  if (activity.weeklyProgress.every((w: any) => w.completed === 0)) {
    recommendations.push("No drill completions in the last 4 weeks. A check-in conversation may be helpful.");
  }
  if (coreMetrics.totalAssigned === 0) {
    recommendations.push("No drills have been assigned yet. Start with 2-3 foundational drills.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Athlete is progressing steadily. Continue current training plan.");
  }

  const reportDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div ref={reportRef} className="space-y-6">
      {/* Report Header */}
      <Card className="border-l-4 border-l-secondary">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <User className="h-6 w-6 text-secondary" />
                <h2 className="text-2xl font-heading font-bold">{athleteName}</h2>
              </div>
              <p className="text-sm text-muted-foreground">Assessment Report — {reportDate}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={engagement.badge}>
                {engagement.level}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="h-5 w-5 text-secondary" />}
          label="Total Assigned"
          value={coreMetrics.totalAssigned}
          subtitle="drills"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label="Completed"
          value={coreMetrics.completed}
          subtitle={`${coreMetrics.completionRate}% rate`}
          color="text-green-500"
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-yellow-500" />}
          label="In Progress"
          value={coreMetrics.inProgress}
          subtitle="active drills"
          color="text-yellow-500"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          label="Avg. Completion"
          value={coreMetrics.avgDaysToComplete > 0 ? `${coreMetrics.avgDaysToComplete}d` : "N/A"}
          subtitle="days per drill"
        />
      </div>

      {/* Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-secondary" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            value={coreMetrics.completed}
            max={coreMetrics.totalAssigned}
            label="Completion Rate"
            color="bg-green-500"
          />
          <ProgressBar
            value={coreMetrics.inProgress}
            max={coreMetrics.totalAssigned}
            label="In Progress"
            color="bg-yellow-500"
          />
          <ProgressBar
            value={coreMetrics.assigned}
            max={coreMetrics.totalAssigned}
            label="Not Started"
            color="bg-muted-foreground/50"
          />
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary" />
            Weekly Activity (Last 4 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.weeklyProgress.length > 0 ? (
            <WeeklyChart data={activity.weeklyProgress} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No weekly activity data available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Completions & Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Completions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              Recent Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.recentCompletions.length > 0 ? (
              <div className="space-y-3">
                {activity.recentCompletions.map((rc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">{rc.drillName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {rc.completedAt ? new Date(rc.completedAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No completions yet</p>
            )}
          </CardContent>
        </Card>

        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Target className="h-5 w-5 text-secondary" />
              Active Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.filter((a: any) => a.status !== "completed").length > 0 ? (
              <div className="space-y-3">
                {assignments
                  .filter((a: any) => a.status !== "completed")
                  .slice(0, 5)
                  .map((a: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${a.status === "in-progress" ? "bg-yellow-500" : "bg-muted-foreground/50"}`} />
                        <span className="text-sm font-medium">{a.drillName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{a.status}</Badge>
                    </div>
                  ))}
                {assignments.filter((a: any) => a.status !== "completed").length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{assignments.filter((a: any) => a.status !== "completed").length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">All drills completed!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coach Notes Summary */}
      {coachNotes && coachNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Recent Coach Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coachNotes.slice(0, 3).map((note: any, i: number) => (
                <div key={i} className="bg-muted/30 rounded-lg p-4 border-l-2 border-l-secondary/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {note.meetingDate ? new Date(note.meetingDate).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{note.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="border-secondary/30">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <ChevronRight className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AthleteAssessment() {
  const { user } = useAuth();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const { data: overview, isLoading: overviewLoading } = trpc.drillAssignments.getAthleteAssignmentOverview.useQuery();

  const athletes = useMemo(() => {
    if (!overview?.athletes) return [];
    return overview.athletes
      .filter((a) => a.type === "user")
      .map((a) => ({
        id: a.id.replace("user-", ""),
        name: a.name,
        email: a.email,
        totalDrills: a.totalDrills,
        completedDrills: a.completedDrills,
        hasDrills: a.hasDrills,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [overview]);

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/coach-dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-heading font-bold text-foreground">Athlete Assessment Reports</h1>
              <p className="text-sm text-muted-foreground">Auto-generated progress reports for each athlete</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Athlete Selector */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
                <User className="h-4 w-4" />
                Select Athlete:
              </div>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Choose an athlete..." />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        {a.name}
                        <span className="text-xs text-muted-foreground">
                          ({a.completedDrills}/{a.totalDrills} drills)
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {selectedAthlete ? (
          <AssessmentReport
            athleteId={parseInt(selectedAthlete.id)}
            athleteName={selectedAthlete.name}
          />
        ) : (
          <div className="text-center py-20">
            <div className="bg-muted/30 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-2">Select an Athlete</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose an athlete from the dropdown above to generate their assessment report with drill completion rates, weekly activity, and personalized recommendations.
            </p>

            {/* Quick Overview Cards */}
            {overview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto">
                <StatCard
                  icon={<User className="h-5 w-5 text-secondary" />}
                  label="Total Athletes"
                  value={overview.summary.totalAthletes}
                />
                <StatCard
                  icon={<Target className="h-5 w-5 text-green-500" />}
                  label="With Drills"
                  value={overview.summary.athletesWithDrills}
                />
                <StatCard
                  icon={<BarChart3 className="h-5 w-5 text-yellow-500" />}
                  label="Total Assigned"
                  value={overview.summary.totalDrillsAssigned}
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                  label="Completion Rate"
                  value={`${overview.summary.completionRate}%`}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
