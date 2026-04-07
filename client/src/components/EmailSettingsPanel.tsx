import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mail, CheckCircle, XCircle, AlertTriangle, Send,
  RefreshCw, Key, Globe, Zap,
} from "lucide-react";

function StatusRow({ label, value, ok, icon: Icon }: {
  label: string; value: string; ok: boolean; icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${ok ? "text-green-400" : "text-red-400"}`} />
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-white/50 max-w-[200px] truncate">{value}</span>
        {ok
          ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
      </div>
    </div>
  );
}

export function EmailSettingsPanel() {
  const [testEmail, setTestEmail] = useState("");
  const [lastResult, setLastResult] = useState<{
    success: boolean; error?: string; messageId?: string;
  } | null>(null);

  const { data: status, isLoading, refetch } = trpc.admin.getEmailStatus.useQuery();

  const testMutation = trpc.admin.testEmailDelivery.useMutation({
    onSuccess: (result) => {
      setLastResult(result);
      if (result.success) {
        toast.success(`Test email sent to ${testEmail}! Check your inbox.`);
      } else {
        toast.error(`Email failed: ${result.error}`);
      }
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-white/40 py-8 justify-center">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading email config...</span>
      </div>
    );
  }

  const allGood = status?.hasResendKey && status?.fromEmail !== "onboarding@resend.dev";

  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5 text-teal-400" />
            Email Configuration
            <button onClick={() => refetch()} className="ml-auto">
              <RefreshCw className="h-3.5 w-3.5 text-white/30 hover:text-white/60" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status && (
            <div>
              <StatusRow
                label="Resend API Key"
                value={status.hasResendKey ? "✓ Set in environment" : "❌ NOT SET — emails cannot send"}
                ok={status.hasResendKey}
                icon={Key}
              />
              <StatusRow
                label="From Email"
                value={status.fromEmail}
                ok={status.fromEmail !== "onboarding@resend.dev" && status.hasResendKey}
                icon={Mail}
              />
              <StatusRow
                label="App / Portal URL"
                value={status.appUrl}
                ok={!status.appUrl.includes("localhost")}
                icon={Globe}
              />
              <StatusRow
                label="AI (Gemini Key)"
                value={status.hasGeminiKey ? "✓ Set" : "Using Forge proxy"}
                ok={status.hasGeminiKey || status.hasForgeKey}
                icon={Zap}
              />
            </div>
          )}

          {!status?.hasResendKey && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-300 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                RESEND_API_KEY is missing
              </p>
              <p className="text-xs text-red-300/70 mt-1">
                Add your Resend API key to the Manus environment variables panel.
                Go to: Manus → Your App → Settings → Environment Variables → Add <code>RESEND_API_KEY</code>
              </p>
            </div>
          )}

          {status?.fromEmail === "onboarding@resend.dev" && status?.hasResendKey && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-300 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Using Resend default from address
              </p>
              <p className="text-xs text-amber-300/70 mt-1">
                To send from <strong>coach@coachstevemobilecoach.com</strong>, verify that domain in your 
                Resend dashboard and set <code>RESEND_FROM_EMAIL=coach@coachstevemobilecoach.com</code> in env vars.
                Until then, emails come from <em>onboarding@resend.dev</em> (free tier default — still deliverable).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test email */}
      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-5 w-5 text-[#e4002b]" />
            Send Test Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-white/50">
            Send a test email to confirm delivery is working end-to-end.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-white/[0.06] border-white/10 text-white flex-1"
            />
            <Button
              onClick={() => testMutation.mutate({ toEmail: testEmail })}
              disabled={!testEmail || testMutation.isPending || !status?.hasResendKey}
              className="bg-[#e4002b] hover:bg-[#c0001f] text-white gap-1.5 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
              {testMutation.isPending ? "Sending..." : "Send Test"}
            </Button>
          </div>

          {lastResult && (
            <div className={`p-3 rounded-lg border text-sm ${
              lastResult.success
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}>
              {lastResult.success ? (
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Email sent successfully! Message ID: <code className="text-xs">{lastResult.messageId}</code>
                </p>
              ) : (
                <p className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Failed: {lastResult.error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-white/60">
            <li className="flex gap-2">
              <span className="text-[#e4002b] font-bold flex-shrink-0">1.</span>
              Log into <strong>resend.com</strong> → API Keys → copy your key
            </li>
            <li className="flex gap-2">
              <span className="text-[#e4002b] font-bold flex-shrink-0">2.</span>
              In Manus: App Settings → Environment Variables → add <code>RESEND_API_KEY=re_xxxx</code>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e4002b] font-bold flex-shrink-0">3.</span>
              In Resend: Domains → Add Domain → verify <strong>coachstevemobilecoach.com</strong> (add DNS records)
            </li>
            <li className="flex gap-2">
              <span className="text-[#e4002b] font-bold flex-shrink-0">4.</span>
              Add <code>RESEND_FROM_EMAIL=coach@coachstevemobilecoach.com</code> to Manus env vars
            </li>
            <li className="flex gap-2">
              <span className="text-[#e4002b] font-bold flex-shrink-0">5.</span>
              Redeploy the app, then click "Send Test" above to confirm
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
