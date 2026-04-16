import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Trash2, RefreshCw, AlertTriangle, CheckCircle, Copy } from "lucide-react";

export function DuplicateDetectionPanel() {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: groups = [], isLoading, refetch } = trpc.admin.findDuplicateAthletes.useQuery();

  const deleteMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Duplicate removed");
      utils.admin.findDuplicateAthletes.invalidate();
      utils.admin.getAllUsers.invalidate();
      utils.drillAssignments.getAthleteAssignmentOverview.invalidate();
      setDeletingId(null);
    },
    onError: err => toast.error(`Failed: ${err.message}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-white/40 py-8 justify-center">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Scanning for duplicates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {groups.length === 0 ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          )}
          <span className="text-sm text-white/70">
            {groups.length === 0
              ? "No duplicates found — athlete list is clean"
              : `${groups.length} duplicate group${groups.length !== 1 ? "s" : ""} found`}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 border-white/20 text-white/60 hover:text-white text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Re-scan
        </Button>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-6 text-white/25 text-sm">
          All athlete records are unique. Future registrations with duplicate emails
          are blocked automatically at sign-up.
        </div>
      )}

      {groups.map((group, gi) => (
        <Card key={gi} className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs">
                {group.reason}
              </Badge>
              <span className="text-white/60 font-mono text-xs">{group.key}</span>
              <span className="text-white/30 text-xs ml-auto">{group.users.length} records</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.users.map((u, ui) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  ui === 0
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    ui === 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {ui === 0 ? "✓" : ui + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {u.name || <span className="text-white/30 italic">No name</span>}
                    </p>
                    <p className="text-xs text-white/40 truncate">{u.email || "No email"}</p>
                  </div>
                  {ui === 0 && (
                    <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px] flex-shrink-0">
                      Keep
                    </Badge>
                  )}
                </div>
                {ui > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs gap-1 flex-shrink-0 ml-2"
                    disabled={deletingId === u.id || deleteMutation.isPending}
                    onClick={() => {
                      setDeletingId(u.id);
                      deleteMutation.mutate({ userId: u.id });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingId === u.id ? "Removing..." : "Remove"}
                  </Button>
                )}
              </div>
            ))}
            <p className="text-[10px] text-white/25 pt-1">
              The first record (✓) is kept. Click Remove on duplicates to delete them and their assignments.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
