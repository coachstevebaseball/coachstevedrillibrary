import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Bell, Mail, AlertTriangle, Trophy, Clock, Zap,
  CheckCircle, RefreshCw, Filter, ChevronDown, ChevronUp,
  User, Activity, TrendingUp, Calendar, Eye, EyeOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type FeedEvent = {
  id: string;
  source: "activity" | "email";
  eventType: string;
  title: string;
  message: string;
  athleteId?: number | null;
  athleteName?: string | null;
  severity: string;
  isRead: number;
  metadata?: any;
  createdAt: Date | string;
};

type FilterType = "all" | "unread" | "alerts" | "emails" | "milestones";

// ── Event type config ─────────────────────────────────────────
const EVENT_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
}> = {
  inactivity_flag:         { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Inactivity Alert" },
  milestone_reached:       { icon: Trophy,        color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Milestone" },
  assignment_reminder_sent:{ icon: Clock,          color: "text-blue-400",  bg: "bg-blue-500/10",  label: "Reminder Sent" },
  metrics_updated:         { icon: TrendingUp,    color: "text-[#e4002b]", bg: "bg-[#e4002b]/10", label: "Metrics Updated" },
  email_sent:              { icon: Mail,          color: "text-teal-400",  bg: "bg-teal-500/10",  label: "Email Sent" },
  drill_assignment:        { icon: Zap,           color: "text-violet-400",bg: "bg-violet-500/10",label: "Drill Assigned" },
  drill_reminder:          { icon: Bell,          color: "text-orange-400",bg: "bg-orange-500/10",label: "Drill Reminder" },
  metrics_update:          { icon: TrendingUp,    color: "text-[#e4002b]", bg: "bg-[#e4002b]/10", label: "Blast Update" },
  milestone:               { icon: Trophy,        color: "text-yellow-400",bg: "bg-yellow-500/10",label: "Milestone" },
  milestone_10_drills:     { icon: Trophy,        color: "text-yellow-400",bg: "bg-yellow-500/10",label: "10 Drills 🎉" },
  custom_note:             { icon: Mail,          color: "text-teal-400",  bg: "bg-teal-500/10",  label: "Custom Note" },
  welcome:                 { icon: CheckCircle,   color: "text-green-400", bg: "bg-green-500/10", label: "Welcome" },
};

const DEFAULT_EVENT = { icon: Activity, color: "text-white/40", bg: "bg-white/[0.06]", label: "Event" };

function getEventConfig(eventType: string) {
  return EVENT_CONFIG[eventType] ?? DEFAULT_EVENT;
}

// ── Time formatting ───────────────────────────────────────────
function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── Severity badge ────────────────────────────────────────────
function SeverityDot({ severity }: { severity: string }) {
  const cls =
    severity === "warning" ? "bg-amber-400" :
    severity === "success" ? "bg-green-400" :
    severity === "error"   ? "bg-red-400"   : "bg-blue-400";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls} flex-shrink-0 mt-1.5`} />;
}

// ── Single feed event card ────────────────────────────────────
function FeedCard({ event, onMarkRead }: { event: FeedEvent; onMarkRead: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getEventConfig(event.eventType);
  const Icon = cfg.icon;
  const isUnread = event.source === "activity" && event.isRead === 0;
  const numericId = parseInt(event.id.split("-")[1]);

  return (
    <div
      className={`relative flex gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group ${
        isUnread ? "bg-white/[0.025]" : ""
      }`}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#e4002b] rounded-r" />
      )}

      {/* Icon */}
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              {event.athleteName && (
                <span className="flex items-center gap-1 text-xs text-white/50">
                  <User className="h-3 w-3" />
                  {event.athleteName}
                </span>
              )}
              {event.source === "email" && (
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/30 py-0 px-1.5">
                  email
                </Badge>
              )}
            </div>
            <p className="text-sm text-white/80 font-medium mt-1 leading-snug truncate">
              {event.title}
            </p>
            {event.message && event.message !== event.title && (
              <p className={`text-xs text-white/50 mt-0.5 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
                {event.message}
              </p>
            )}
            {event.message && event.message !== event.title && event.message.length > 120 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-[10px] text-white/30 hover:text-white/60 mt-0.5 flex items-center gap-0.5"
              >
                {expanded ? <><ChevronUp className="h-3 w-3" />Less</> : <><ChevronDown className="h-3 w-3" />More</>}
              </button>
            )}
          </div>

          {/* Timestamp + actions */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-white/30 whitespace-nowrap" title={formatDate(event.createdAt)}>
              {timeAgo(event.createdAt)}
            </span>
            {isUnread && (
              <button
                onClick={() => onMarkRead(numericId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/30 hover:text-white/60 flex items-center gap-0.5"
                title="Mark as read"
              >
                <Eye className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ filter }: { filter: FilterType }) {
  const msgs: Record<FilterType, { title: string; sub: string }> = {
    all:        { title: "No activity yet", sub: "Events will appear here as athletes engage with the platform." },
    unread:     { title: "All caught up!", sub: "No unread alerts." },
    alerts:     { title: "No alerts", sub: "No inactivity flags or warnings at this time." },
    emails:     { title: "No emails logged", sub: "Sent emails will appear here." },
    milestones: { title: "No milestones yet", sub: "Athlete milestones will appear here." },
  };
  const { title, sub } = msgs[filter];
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="h-12 w-12 rounded-full bg-white/[0.06] flex items-center justify-center">
        <Bell className="h-6 w-6 text-white/20" />
      </div>
      <p className="text-white/40 font-medium">{title}</p>
      <p className="text-white/25 text-sm max-w-xs">{sub}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function ActivityFeedTab() {
  const [filter, setFilter] = useState<FilterType>("all");
  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.admin.getActivityFeed.useQuery(
    { limit: 50, offset: 0 },
    { refetchInterval: 60000 } // auto-refresh every 60s
  );

  const markReadMutation = trpc.admin.markActivityRead.useMutation({
    onSuccess: () => utils.admin.getActivityFeed.invalidate(),
  });

  const markAllReadMutation = trpc.admin.markAllActivityRead.useMutation({
    onSuccess: () => {
      toast.success("All alerts marked as read");
      utils.admin.getActivityFeed.invalidate();
    },
  });

  const events: FeedEvent[] = data?.events ?? [];

  // Stats
  const unreadCount = events.filter(e => e.source === "activity" && e.isRead === 0).length;
  const alertCount = events.filter(e => ["inactivity_flag", "warning"].includes(e.eventType)).length;
  const emailCount = events.filter(e => e.source === "email").length;
  const milestoneCount = events.filter(e => ["milestone", "milestone_reached", "milestone_10_drills"].includes(e.eventType)).length;

  // Filtered events
  const filtered = useMemo(() => {
    switch (filter) {
      case "unread":     return events.filter(e => e.source === "activity" && e.isRead === 0);
      case "alerts":     return events.filter(e => ["inactivity_flag", "warning", "error"].includes(e.eventType));
      case "emails":     return events.filter(e => e.source === "email");
      case "milestones": return events.filter(e => ["milestone", "milestone_reached", "milestone_10_drills"].includes(e.eventType));
      default:           return events;
    }
  }, [events, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; events: FeedEvent[] }[] = [];
    const seen = new Set<string>();
    for (const evt of filtered) {
      const d = new Date(evt.createdAt);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const isYesterday = d.toDateString() === new Date(Date.now() - 86400000).toDateString();
      const label = isToday ? "Today" : isYesterday ? "Yesterday" : d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      if (!seen.has(label)) { seen.add(label); groups.push({ label, events: [] }); }
      groups[groups.length - 1].events.push(evt);
    }
    return groups;
  }, [filtered]);

  const FILTERS: { key: FilterType; label: string; count?: number }[] = [
    { key: "all",        label: "All",        count: events.length },
    { key: "unread",     label: "Unread",     count: unreadCount },
    { key: "alerts",     label: "Alerts",     count: alertCount },
    { key: "emails",     label: "Emails",     count: emailCount },
    { key: "milestones", label: "Milestones", count: milestoneCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-[#e4002b]" />
            Activity Feed
            {unreadCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#e4002b] text-white text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Athlete alerts, email notifications, and system events
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="gap-1.5 border-white/20 text-white/60 hover:text-white text-xs"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 border-white/20 text-white/60 hover:text-white text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Unread Alerts", value: unreadCount, color: "text-[#e4002b]", icon: Bell },
          { label: "Inactivity Flags", value: alertCount, color: "text-amber-400", icon: AlertTriangle },
          { label: "Emails Sent", value: emailCount, color: "text-teal-400", icon: Mail },
          { label: "Milestones", value: milestoneCount, color: "text-yellow-400", icon: Trophy },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white/[0.04] rounded-xl p-3.5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-[#e4002b] text-white"
                : "bg-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.10]"
            }`}
          >
            <Filter className="h-3 w-3" />
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className={`text-[10px] px-1 rounded ${
                filter === f.key ? "bg-white/20" : "bg-white/10"
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <Card className="bg-white/[0.04] border-white/[0.08] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-white/40">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading activity...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div>
            {grouped.map(group => (
              <div key={group.label}>
                {/* Date separator */}
                <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2 bg-[#0d1117]/95 backdrop-blur-sm border-b border-white/[0.04]">
                  <Calendar className="h-3.5 w-3.5 text-white/30" />
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {group.events.length} event{group.events.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {group.events.map(evt => (
                  <FeedCard
                    key={evt.id}
                    event={evt}
                    onMarkRead={id => markReadMutation.mutate({ id })}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Footer hint */}
      <p className="text-center text-xs text-white/20">
        Feed auto-refreshes every 60 seconds · Showing last 50 events
      </p>
    </div>
  );
}
