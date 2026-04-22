import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Pencil, Save, X, ChevronLeft, ChevronRight, FileText,
  Wrench, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Target,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { TopNav } from "@/components/TopNav";
import { trpc } from "@/lib/trpc";
import { useAllDrills } from "@/hooks/useAllDrills";

interface MergedDrill {
  id: string;
  name: string;
  difficulty: string;
  duration: string;
  goal: string | null;
  instructions: string | null;
  equipment: string | null;
}

const PAGE_SIZE = 20;

export default function ManageDrillContent() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const allDrills = useAllDrills();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingDrill, setEditingDrill] = useState<MergedDrill | null>(null);
  const [editGoal, setEditGoal] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editEquipment, setEditEquipment] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "filled" | "empty">("all");

  // Fetch all drill details from the database via tRPC
  const { data: drillDetails, isLoading, error, refetch } = trpc.drillDetails.getAllDrillDetails.useQuery(
    undefined,
    { enabled: isAdmin }
  );

  // Merge static drills with database details
  const mergedDrills: MergedDrill[] = useMemo(() => {
    const detailsMap = new Map<string, { goal: string | null; instructions: string | null; equipment: string | null }>();
    if (drillDetails) {
      for (const d of drillDetails) {
        detailsMap.set(d.drillId, {
          goal: d.goal || null,
          instructions: d.instructions || null,
          equipment: d.equipment || null,
        });
      }
    }
    return allDrills.map((drill) => {
      const detail = detailsMap.get(drill.id);
      return {
        id: drill.id,
        name: drill.name,
        difficulty: drill.difficulty,
        duration: drill.duration,
        goal: detail?.goal ?? null,
        instructions: detail?.instructions ?? null,
        equipment: detail?.equipment ?? null,
      };
    });
  }, [drillDetails]);

  // Filter and search
  const filteredDrills = useMemo(() => {
    let result = mergedDrills;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q));
    }

    if (filterStatus === "filled") {
      result = result.filter((d) => d.instructions || d.equipment || d.goal);
    } else if (filterStatus === "empty") {
      result = result.filter((d) => !d.instructions && !d.equipment && !d.goal);
    }

    return result;
  }, [mergedDrills, searchQuery, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredDrills.length / PAGE_SIZE);
  const paginatedDrills = filteredDrills.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Stats
  const filledCount = mergedDrills.filter((d) => d.instructions || d.equipment || d.goal).length;
  const emptyCount = mergedDrills.length - filledCount;

  // Open edit dialog
  const openEdit = (drill: MergedDrill) => {
    setEditingDrill(drill);
    setEditGoal(drill.goal || "");
    setEditInstructions(drill.instructions || "");
    setEditEquipment(drill.equipment || "");
  };

  // Save via tRPC
  const updateMutation = trpc.drillDetails.updateDrillContent.useMutation({
    onSuccess: () => {
      toast.success(`Updated "${editingDrill?.name}" successfully`);
      setEditingDrill(null);
      refetch();
    },
    onError: (err) => {
      toast.error("Failed to save: " + err.message);
    },
  });

  const handleSave = () => {
    if (!editingDrill) return;
    updateMutation.mutate({
      drillId: editingDrill.id,
      goal: editGoal || undefined,
      instructions: editInstructions || undefined,
      equipment: editEquipment || undefined,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav variant="compact" />
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Access Denied
              </CardTitle>
              <CardDescription>
                Only administrators can manage drill content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button className="w-full">Return to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav variant="compact" />

      {/* Header */}
      <header className="border-b border-white/10 bg-card/50">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Manage Drill Content
          </h1>
          <p className="text-muted-foreground">
            Edit goal, instructions, and equipment for each drill. Changes appear in real-time on drill detail pages.
          </p>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card
            className={`cursor-pointer transition-all ${filterStatus === "all" ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-white/20"}`}
            onClick={() => { setFilterStatus("all"); setPage(1); }}
          >
            <CardHeader className="pb-3">
              <CardDescription>Total Drills</CardDescription>
              <CardTitle className="text-3xl">{mergedDrills.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${filterStatus === "filled" ? "ring-2 ring-emerald-500" : "hover:ring-1 hover:ring-white/20"}`}
            onClick={() => { setFilterStatus("filled"); setPage(1); }}
          >
            <CardHeader className="pb-3">
              <CardDescription>With Content</CardDescription>
              <CardTitle className="text-3xl text-emerald-500 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                {filledCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${filterStatus === "empty" ? "ring-2 ring-amber-500" : "hover:ring-1 hover:ring-white/20"}`}
            onClick={() => { setFilterStatus("empty"); setPage(1); }}
          >
            <CardHeader className="pb-3">
              <CardDescription>Needs Content</CardDescription>
              <CardTitle className="text-3xl text-amber-500 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                {emptyCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drills by name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Failed to load drill details: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Drills Table */}
        {!isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Drill Content ({filteredDrills.length} drills)</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Page {page} of {totalPages || 1}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Drill Name</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Instructions</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDrills.map((drill) => (
                    <TableRow key={drill.id} className="group">
                      <TableCell className="font-medium">{drill.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {drill.difficulty || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {drill.goal ? (
                          <span className="flex items-center gap-1 text-emerald-500 text-sm">
                            <Target className="h-3.5 w-3.5" />
                            Filled
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Empty</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {drill.instructions ? (
                          <span className="flex items-center gap-1 text-emerald-500 text-sm">
                            <FileText className="h-3.5 w-3.5" />
                            Filled
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Empty</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {drill.equipment ? (
                          <span className="flex items-center gap-1 text-emerald-500 text-sm">
                            <Wrench className="h-3.5 w-3.5" />
                            Filled
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Empty</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(drill)}
                          className="gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedDrills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No drills found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filteredDrills.length)} of{" "}
                    {filteredDrills.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingDrill} onOpenChange={(open) => !open && setEditingDrill(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit: {editingDrill?.name}
            </DialogTitle>
            <DialogDescription>
              Update the goal, instructions, and equipment for this drill. Changes save to the database and appear on drill detail pages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Goal */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Drill Goal
              </label>
              <Textarea
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder="What is the primary goal of this drill? (e.g., Develop hip rotation and bat speed through the zone)"
                rows={3}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A concise statement of what the athlete will develop or improve.
              </p>
            </div>

            {/* Instructions */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Instructions
              </label>
              <Textarea
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                placeholder="Enter step-by-step instructions for this drill..."
                rows={8}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use plain text. Each line will be treated as a separate step.
              </p>
            </div>

            {/* Equipment */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Equipment Needed
              </label>
              <Textarea
                value={editEquipment}
                onChange={(e) => setEditEquipment(e.target.value)}
                placeholder="List the equipment needed (e.g., batting tee, baseballs, net)..."
                rows={3}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate items with commas or new lines.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingDrill(null)}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
