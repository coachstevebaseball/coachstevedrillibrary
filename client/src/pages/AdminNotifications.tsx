import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send, Search, ArrowLeft, Bell, Users, User, CheckCircle2,
  XCircle, Clock, Loader2, Mail, Megaphone, History, AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Tab = "compose" | "history";

export default function AdminNotifications() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("compose");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0f1d35] to-[#0a1628] border-b border-white/10">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/coach-dashboard">
              <button className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#DC143C]/30 to-orange-500/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#E8425A]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Notifications Center</h1>
              <p className="text-sm text-white/50">Send custom notifications to your athletes</p>
            </div>
          </div>

          {/* Tab pills */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("compose")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "compose"
                  ? "bg-[#DC143C] text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Send className="h-4 w-4" />
              Compose
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-[#DC143C] text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <History className="h-4 w-4" />
              Sent History
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {activeTab === "compose" ? <ComposeTab /> : <SentHistoryTab />}
      </div>
    </div>
  );
}

// ─── Compose Tab ──────────────────────────────────────────────────────────────

function ComposeTab() {
  const [mode, setMode] = useState<"individual" | "broadcast">("individual");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Fetch athletes for recipient picker
  const { data: athletes = [], isLoading: athletesLoading } = trpc.notifications.adminGetAthletes.useQuery();

  const composeMutation = trpc.notifications.adminCompose.useMutation();
  const broadcastMutation = trpc.notifications.adminBroadcast.useMutation();

  // Filter athletes by search
  const filteredAthletes = useMemo(() => {
    if (!searchQuery) return athletes;
    const q = searchQuery.toLowerCase();
    return athletes.filter(
      (a: any) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    );
  }, [athletes, searchQuery]);

  const toggleRecipient = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(filteredAthletes.map((a: any) => a.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (mode === "individual" && selectedIds.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }

    setIsSending(true);
    try {
      let result;
      if (mode === "broadcast") {
        result = await broadcastMutation.mutateAsync({
          title: title.trim(),
          message: message.trim(),
          linkUrl: linkUrl.trim() || undefined,
        });
      } else {
        result = await composeMutation.mutateAsync({
          recipientIds: selectedIds,
          title: title.trim(),
          message: message.trim(),
          linkUrl: linkUrl.trim() || undefined,
        });
      }

      toast.success(
        `Notification sent to ${result.sent} athlete${result.sent !== 1 ? "s" : ""}${
          result.failed > 0 ? ` (${result.failed} failed)` : ""
        }`
      );

      // Reset form
      setTitle("");
      setMessage("");
      setLinkUrl("");
      setSelectedIds([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Compose form */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-[#DC143C]" />
              Compose Notification
            </CardTitle>
            <CardDescription>
              Send a custom email notification to your athletes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setMode("individual")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === "individual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-4 w-4" />
                Select Athletes
              </button>
              <button
                onClick={() => setMode("broadcast")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === "broadcast"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                All Athletes
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Subject
              </label>
              <Input
                placeholder="e.g., Practice Update, New Drill Available..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Message
              </label>
              <Textarea
                placeholder="Write your message to the athlete(s)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-y"
              />
            </div>

            {/* Optional link */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Link URL <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                placeholder="e.g., /athlete-portal or https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adds a "View Message" button in the email linking to this URL
              </p>
            </div>

            {/* Send button */}
            <div className="pt-2">
              <Button
                onClick={handleSend}
                disabled={isSending || !title.trim() || !message.trim() || (mode === "individual" && selectedIds.length === 0)}
                className="w-full bg-[#DC143C] hover:bg-[#b91c1c] text-white"
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {mode === "broadcast"
                      ? `Send to All Active Athletes (${athletes.length})`
                      : `Send to ${selectedIds.length} Athlete${selectedIds.length !== 1 ? "s" : ""}`}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {(title || message) && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#2a2a2a]">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6 text-center border-b-2 border-[#dc2626]">
                  <div className="text-3xl mb-2">📣</div>
                  <h3 className="text-white font-bold text-lg">{title || "Subject"}</h3>
                  <p className="text-white/50 text-xs uppercase tracking-widest mt-2">Coach Steve Baseball</p>
                </div>
                {/* Body */}
                <div className="p-6">
                  <p className="text-[#b0b0b0] text-sm mb-4">Hi [Athlete Name],</p>
                  <div className="bg-[#1a1a1a] p-4 rounded-lg border-l-4 border-[#dc2626]">
                    <p className="text-[#d0d0d0] text-sm whitespace-pre-wrap">{message || "Your message..."}</p>
                  </div>
                  {linkUrl && (
                    <div className="text-center mt-4">
                      <span className="inline-block bg-[#dc2626] text-white px-6 py-2.5 rounded-lg text-sm font-bold">
                        View Message
                      </span>
                    </div>
                  )}
                  <p className="text-[#888] text-xs mt-6">
                    Keep training hard and stay focused. Every rep counts!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Recipient picker (only in individual mode) */}
      {mode === "individual" && (
        <div className="lg:col-span-2">
          <Card className="bg-card border-border sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#DC143C]" />
                  Recipients
                </span>
                <Badge variant="secondary" className="font-mono">
                  {selectedIds.length}/{athletes.length}
                </Badge>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search athletes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-1 pt-0">
              {athletesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAthletes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No athletes found
                </p>
              ) : (
                filteredAthletes.map((athlete: any) => (
                  <label
                    key={athlete.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedIds.includes(athlete.id)
                        ? "bg-[#DC143C]/10 border border-[#DC143C]/30"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.includes(athlete.id)}
                      onCheckedChange={() => toggleRecipient(athlete.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {athlete.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {athlete.email || "No email"}
                      </p>
                    </div>
                    {!athlete.email && (
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                        No email
                      </Badge>
                    )}
                  </label>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Sent History Tab ─────────────────────────────────────────────────────────

function SentHistoryTab() {
  const { data, isLoading } = trpc.notifications.adminSentHistory.useQuery({ limit: 100, offset: 0 });

  // Group notifications by title + approximate time (within 5 seconds = same batch)
  const groupedMessages = useMemo(() => {
    if (!data?.items) return [];

    const groups: {
      title: string;
      message: string;
      sentAt: Date | null;
      recipients: { name: string; email: string | null; status: string }[];
      linkUrl: string | null;
      isBroadcast: boolean;
    }[] = [];

    const sorted = [...data.items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const item of sorted) {
      const itemTime = new Date(item.createdAt).getTime();
      // Find existing group with same title within 60 seconds
      const existing = groups.find(
        (g) =>
          g.title === item.title &&
          g.sentAt &&
          Math.abs(new Date(g.sentAt).getTime() - itemTime) < 60000
      );

      if (existing) {
        existing.recipients.push({
          name: item.recipientName,
          email: item.recipientEmail,
          status: item.emailStatus,
        });
      } else {
        const meta = item.metadata as any;
        groups.push({
          title: item.title,
          message: item.message,
          sentAt: item.sentAt || item.createdAt,
          linkUrl: item.linkUrl,
          isBroadcast: meta?.broadcast === true,
          recipients: [
            {
              name: item.recipientName,
              email: item.recipientEmail,
              status: item.emailStatus,
            },
          ],
        });
      }
    }

    return groups;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (groupedMessages.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Mail className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No notifications sent yet</h3>
          <p className="text-sm text-muted-foreground">
            Compose your first custom notification to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Sent Notifications
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({data?.total || 0} total deliveries)
          </span>
        </h2>
      </div>

      {groupedMessages.map((group, idx) => {
        const sentCount = group.recipients.filter((r) => r.status === "sent").length;
        const failedCount = group.recipients.filter((r) => r.status === "failed").length;

        return (
          <Card key={idx} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {group.isBroadcast ? (
                      <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">
                        <Megaphone className="h-3 w-3 mr-1" />
                        Broadcast
                      </Badge>
                    ) : (
                      <Badge className="bg-[#DC143C]/15 text-[#E8425A] border-[#DC143C]/30 text-[10px]">
                        <User className="h-3 w-3 mr-1" />
                        Individual
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {group.sentAt
                        ? new Date(group.sentAt).toLocaleString("en-US", {
                            timeZone: "America/New_York",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }) + " EST"
                        : "Pending"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{group.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.message}</p>
                </div>

                <div className="flex items-center gap-3 text-sm shrink-0">
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{sentCount}</span>
                  </div>
                  {failedCount > 0 && (
                    <div className="flex items-center gap-1 text-red-400">
                      <XCircle className="h-4 w-4" />
                      <span>{failedCount}</span>
                    </div>
                  )}
                  <Badge variant="secondary" className="font-mono text-xs">
                    {group.recipients.length} recipient{group.recipients.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Recipient list (collapsed by default for broadcasts) */}
              {group.recipients.length <= 5 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {group.recipients.map((r, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        r.status === "sent"
                          ? "bg-green-500/10 text-green-400"
                          : r.status === "failed"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {r.status === "sent" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : r.status === "failed" ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {r.name}
                    </span>
                  ))}
                </div>
              ) : (
                <RecipientExpander recipients={group.recipients} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RecipientExpander({
  recipients,
}: {
  recipients: { name: string; email: string | null; status: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? recipients : recipients.slice(0, 3);

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {shown.map((r, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
              r.status === "sent"
                ? "bg-green-500/10 text-green-400"
                : r.status === "failed"
                ? "bg-red-500/10 text-red-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {r.status === "sent" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : r.status === "failed" ? (
              <XCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {r.name}
          </span>
        ))}
      </div>
      {recipients.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#DC143C] hover:underline mt-1.5"
        >
          {expanded ? "Show less" : `+${recipients.length - 3} more`}
        </button>
      )}
    </div>
  );
}
