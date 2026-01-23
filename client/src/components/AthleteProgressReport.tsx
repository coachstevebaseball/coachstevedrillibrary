import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  Target,
  Activity,
  Award
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AthleteProgressReportProps {
  userId: number;
  athleteName: string;
}

export function AthleteProgressReport({ userId, athleteName }: AthleteProgressReportProps) {
  const { data: progressData, isLoading, error } = trpc.drillAssignments.getAthleteProgress.useQuery(
    { userId },
    { enabled: !!userId }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load progress data</p>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No progress data available</p>
        </CardContent>
      </Card>
    );
  }

  const { coreMetrics, activity, drillBreakdown } = progressData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{athleteName}'s Progress</h2>
          <p className="text-muted-foreground">
            Last active: {activity.lastActivityDate 
              ? new Date(activity.lastActivityDate).toLocaleDateString() 
              : "No activity yet"}
          </p>
        </div>
        <Badge variant={coreMetrics.completionRate >= 75 ? "default" : coreMetrics.completionRate >= 50 ? "secondary" : "outline"} className="text-lg px-4 py-2">
          {coreMetrics.completionRate}% Complete
        </Badge>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coreMetrics.totalAssigned}</p>
                <p className="text-sm text-muted-foreground">Total Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coreMetrics.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coreMetrics.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coreMetrics.assigned}</p>
                <p className="text-sm text-muted-foreground">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={coreMetrics.completionRate} className="h-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{coreMetrics.completed} of {coreMetrics.totalAssigned} drills completed</span>
              <span>Avg. {coreMetrics.avgDaysToComplete} days to complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.weeklyProgress.map((week, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{week.week}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(week.completed * 20, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{week.completed}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Completions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.recentCompletions.length > 0 ? (
              <div className="space-y-3">
                {activity.recentCompletions.map((completion, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {completion.drillName}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {completion.completedAt 
                        ? new Date(completion.completedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No completed drills yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Drill Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{coreMetrics.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{coreMetrics.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
              <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{coreMetrics.assigned}</p>
              <p className="text-sm text-muted-foreground">Not Started</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
