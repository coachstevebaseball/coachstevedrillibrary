import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MessageSquare, Video, FileText, Search, Filter, Home, LogOut, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CoachFeedbackPanel } from "@/components/CoachFeedbackPanel";

interface Submission {
  id: number;
  userId: number;
  drillId: string;
  notes: string | null;
  videoUrl: string | null;
  submittedAt: Date;
  athleteName?: string;
}

export default function SubmissionsDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAthlete, setFilterAthlete] = useState("all");
  const [filterDrill, setFilterDrill] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all users for athlete filter
  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  // Fetch all submissions from all athletes
  const { data: allSubmissions = [], isLoading: submissionsLoading } = trpc.drillSubmissions.getSubmissionsByUser.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = allSubmissions.map((sub: any) => ({
      ...sub,
      athleteName: allUsers.find((u: any) => u.id === sub.userId)?.name || `Athlete ${sub.userId}`,
    }));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((sub: any) =>
        sub.athleteName.toLowerCase().includes(query) ||
        sub.drillId.toLowerCase().includes(query) ||
        sub.notes?.toLowerCase().includes(query)
      );
    }

    // Apply athlete filter
    if (filterAthlete !== "all") {
      filtered = filtered.filter((sub: any) => sub.userId.toString() === filterAthlete);
    }

    // Apply drill filter
    if (filterDrill !== "all") {
      filtered = filtered.filter((sub: any) => sub.drillId === filterDrill);
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return sortBy === "recent" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [allSubmissions, searchQuery, filterAthlete, filterDrill, sortBy, allUsers]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique drills for filter
  const uniqueDrills = useMemo(() => {
    const drillSet = new Set(allSubmissions.map((s: any) => s.drillId));
    return Array.from(drillSet);
  }, [allSubmissions]);

  if (loading || submissionsLoading) {
    return <div className="container py-12 text-center">Loading submissions...</div>;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto border-2">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Only coaches can access the submissions dashboard.</p>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
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
          <div className="flex items-center justify-between mb-4">
            <Link href="/coach-dashboard">
              <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 pl-0">
                <Home className="mr-2 h-4 w-4" />
                Coach Dashboard
              </Button>
            </Link>
            <Button onClick={() => logout()} variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-heading font-black">Athlete Submissions</h1>
            <p className="text-primary-foreground/90">Review and provide feedback on athlete drill submissions</p>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl pb-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{filteredSubmissions.length}</div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{allUsers.filter((u: any) => u.role === 'athlete').length}</div>
                <p className="text-sm text-muted-foreground">Active Athletes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">{uniqueDrills.length}</div>
                <p className="text-sm text-muted-foreground">Drills Assigned</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Submissions List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="mb-4">Submissions</CardTitle>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by athlete name, drill, or notes..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select value={filterAthlete} onValueChange={(val) => {
                    setFilterAthlete(val);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by athlete" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Athletes</SelectItem>
                      {allUsers.filter((u: any) => u.role === 'athlete').map((athlete: any) => (
                        <SelectItem key={athlete.id} value={athlete.id.toString()}>
                          {athlete.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterDrill} onValueChange={(val) => {
                    setFilterDrill(val);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by drill" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Drills</SelectItem>
                      {uniqueDrills.map((drillId: string) => (
                        <SelectItem key={drillId} value={drillId}>
                          {drillId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent>
                {paginatedSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedSubmissions.map((submission: Submission) => (
                      <div
                        key={submission.id}
                        onClick={() => setSelectedSubmission(submission)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedSubmission?.id === submission.id ? "border-secondary bg-secondary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-2">{submission.athleteName}</h3>
                            <p className="text-sm text-muted-foreground mb-2">Drill: {submission.drillId}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {submission.notes && (
                                <Badge variant="outline" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  Notes
                                </Badge>
                              )}
                              {submission.videoUrl && (
                                <Badge variant="outline" className="gap-1">
                                  <Video className="h-3 w-3" />
                                  Video
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No submissions found</p>
                    <p className="text-sm">Athletes haven't submitted any drill work yet.</p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Submission Details */}
          <div className="lg:col-span-1">
            {selectedSubmission ? (
              <CoachFeedbackPanel
                submission={selectedSubmission}
                athleteName={selectedSubmission.athleteName || "Unknown Athlete"}
                onFeedbackSent={() => {
                  // Refresh submissions
                }}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a submission to view details and provide feedback</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
