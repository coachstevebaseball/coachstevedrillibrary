import { useState, useMemo } from "react";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Inbox,
  Filter,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Notification type config
const typeConfig: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  drill_assigned: {
    icon: "🎯",
    label: "Drill Assigned",
    color: "bg-blue-500/20 text-blue-400",
  },
  notes_added: {
    icon: "📝",
    label: "Notes Added",
    color: "bg-yellow-500/20 text-yellow-400",
  },
  recap_posted: {
    icon: "📊",
    label: "Recap Posted",
    color: "bg-purple-500/20 text-purple-400",
  },
  swing_analysis_ready: {
    icon: "🎬",
    label: "Swing Analysis",
    color: "bg-green-500/20 text-green-400",
  },
  new_feature_available: {
    icon: "✨",
    label: "New Feature",
    color: "bg-amber-500/20 text-amber-400",
  },
  feedback_received: {
    icon: "💬",
    label: "Feedback",
    color: "bg-cyan-500/20 text-cyan-400",
  },
  submission_received: {
    icon: "📥",
    label: "Submission",
    color: "bg-indigo-500/20 text-indigo-400",
  },
  badge_earned: {
    icon: "🏆",
    label: "Badge Earned",
    color: "bg-orange-500/20 text-orange-400",
  },
  practice_plan_shared: {
    icon: "📋",
    label: "Practice Plan",
    color: "bg-teal-500/20 text-teal-400",
  },
  welcome: {
    icon: "👋",
    label: "Welcome",
    color: "bg-pink-500/20 text-pink-400",
  },
  system: {
    icon: "🔔",
    label: "System",
    color: "bg-gray-500/20 text-gray-400",
  },
};

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsInbox({ embedded = false }: { embedded?: boolean } = {}) {
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Queries
  const { data: allNotifications = [], isLoading } =
    trpc.notifications.getAll.useQuery(undefined, { enabled: !!user });
  const { data: unreadCount = 0 } =
    trpc.notifications.getUnreadCount.useQuery(undefined, { enabled: !!user });

  // Mutations
  const utils = trpc.useUtils();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getUnread.invalidate();
    },
  });
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getUnread.invalidate();
    },
  });
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getUnread.invalidate();
    },
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((n) => {
      if (filter !== "all" && n.type !== filter) return false;
      if (statusFilter === "unread" && n.portalStatus !== "unread") return false;
      if (statusFilter === "read" && n.portalStatus !== "read") return false;
      return true;
    });
  }, [allNotifications, filter, statusFilter]);

  // Get unique types present in notifications
  const availableTypes = useMemo(() => {
    const types = new Set(allNotifications.map((n) => n.type));
    return Array.from(types).sort();
  }, [allNotifications]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Bell className="w-12 h-12 text-foreground/20 mb-4" />
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">
            Sign in to view notifications
          </h2>
          <p className="text-foreground/50 text-sm">
            Log in to your account to see your notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && <TopNav />}

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <a className="p-2 rounded-lg text-foreground/40 hover:text-foreground hover:bg-white/8 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </a>
            </Link>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-sm font-bold bg-electric/20 text-electric px-2.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-sm text-foreground/40 mt-0.5">
                {allNotifications.length} total notification
                {allNotifications.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs border-white/15 text-foreground/60 hover:text-foreground hover:bg-white/10"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                Mark all read
              </Button>
            )}
            <Link href="/notifications/preferences">
              <a className="p-2 rounded-lg text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all">
                <Settings className="w-4.5 h-4.5" />
              </a>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 p-3 rounded-xl border border-white/8 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-foreground/40 text-xs font-medium">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs border-white/15 bg-transparent">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs border-white/15 bg-transparent">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {typeConfig[type]?.icon} {typeConfig[type]?.label || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs text-electric hover:text-electric/80 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Notification List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-foreground/20" />
            </div>
            <h3 className="text-lg font-heading font-bold text-foreground/60 mb-1">
              {filter !== "all" || statusFilter !== "all"
                ? "No matching notifications"
                : "No notifications yet"}
            </h3>
            <p className="text-sm text-foreground/30">
              {filter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "You'll see notifications here when there's activity"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 overflow-hidden divide-y divide-white/5">
            {filteredNotifications.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.system;
              const isUnread = notif.portalStatus === "unread";

              return (
                <div
                  key={notif.id}
                  className={`group relative flex gap-4 px-4 py-4 transition-all duration-200 hover:bg-white/[0.03] ${
                    isUnread ? "bg-electric/[0.03]" : ""
                  }`}
                >
                  {/* Unread indicator */}
                  {isUnread && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-electric shadow-sm shadow-electric/50" />
                  )}

                  {/* Type icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${config.color}`}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4
                          className={`text-sm leading-tight ${
                            isUnread
                              ? "font-bold text-foreground"
                              : "font-medium text-foreground/70"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-foreground/30 whitespace-nowrap">
                          {timeAgo(notif.createdAt)}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Meta + Actions */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-foreground/25">
                        {formatDate(notif.createdAt)}
                      </span>

                      <div className="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUnread && (
                          <button
                            onClick={() =>
                              markAsReadMutation.mutate({
                                notificationId: notif.id,
                              })
                            }
                            className="flex items-center gap-1 text-[11px] text-electric hover:text-electric/80 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Mark read
                          </button>
                        )}
                        {notif.linkUrl && (
                          <Link href={notif.linkUrl}>
                            <a className="flex items-center gap-1 text-[11px] text-foreground/40 hover:text-foreground/70 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open
                            </a>
                          </Link>
                        )}
                        <button
                          onClick={() =>
                            deleteMutation.mutate({
                              notificationId: notif.id,
                            })
                          }
                          className="flex items-center gap-1 text-[11px] text-foreground/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
