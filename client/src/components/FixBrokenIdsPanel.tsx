import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/hooks/use-toast";

export function FixBrokenIdsPanel() {
  const [result, setResult] = useState<{
    fixed: string[];
    remainingBroken: number | string;
  } | null>(null);

  const fixMutation = trpc.admin.fixBrokenIds.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "✅ IDs Fixed",
        description: `Fixed ${data.fixed.length} athlete records. ${data.remainingBroken} assignments still unlinked.`,
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 mt-6">
      <h3 className="text-lg font-bold text-red-400 mb-1">🔧 Fix Broken Athlete IDs</h3>
      <p className="text-sm text-gray-400 mb-4">
        Repairs athlete links broken when user IDs were manually changed.
        Re-links Gavin, Gunnar, Sean, and Emmet's drill assignments and activity history
        back to their correct accounts.
      </p>

      {!result ? (
        <button
          onClick={() => fixMutation.mutate()}
          disabled={fixMutation.isPending}
          className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50 transition-colors"
        >
          {fixMutation.isPending ? "Fixing..." : "Run ID Fix"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="text-green-400 font-semibold">✅ Fix Complete</div>
          <ul className="text-sm text-gray-300 space-y-1">
            {result.fixed.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
          <div className="text-sm text-yellow-400">
            ⚠️ {result.remainingBroken} assignments still have no linked athlete
            (Joey Tavares, Samuel Vargas, and others who need to be re-invited).
          </div>
        </div>
      )}
    </div>
  );
}
