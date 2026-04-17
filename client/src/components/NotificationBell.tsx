import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Inbox } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

// Notification type → icon + color
const typeConfig: Record<string, { icon: string; color: string }> = {
  drill_assigned: { icon: "🎯", color: "bg-blue-500/20 text-blue-400" },
  notes_added: { icon: "📝", color: "bg-yellow-500/20 text-yellow-400" },
  recap_posted: { icon: "📊", color: "bg-purple-500/20 text-purple-400" },
  swing_analysis_ready: { icon: "🎬", color: "bg-green-500/20 text-green-400" },
  new_feature_available: { icon: "✨", color: "bg-amber-500/20 text-amber-400" },
  feedback_received: { icon: "💬", color: "bg-cyan-500/20 text-cyan-400" },
  submission_received: { icon: "📥", color: "bg-indigo-500/20 text-indigo-400" },
  badge_earned: { icon: "🏆", color: "bg-orange-500/20 text-orange-400" },
  practice_plan_shared: { icon: "📋", color: "bg-teal-500/20 text-teal-400" },
  welcome: { icon: "👋", color: "bg-pink-500/20 text-pink-400" },
  system: { icon: "🔔", color: "bg-gray-500/20 text-gray-400" },
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

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Queries
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: !!user, refetchInterval: 30000 }
  );
  const { data: allNotifications = [], refetch } = trpc.notifications.getAll.useQuery(
    undefined,
    { enabled: !!user && isOpen }
  );

  // Mutations
  const utils = trpc.useUtils();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnread.invalidate();
    },
  });
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnread.invalidate();
    },
  });
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnread.invalidate();
    },
  });

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen]);

  if (!user) return null;

  const recentNotifications = allNotifications.slice(0, 8);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric/50"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-electric rounded-full shadow-md shadow-electric/40 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
          style={{
            background: "oklch(0.13 0.02 260 / 0.98)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-foreground">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-electric/20 text-electric px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="flex items-center gap-1 text-xs text-foreground/50 hover:text-electric transition-colors"
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto scrollbar-hide">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-foreground/30" />
                </div>
                <p className="text-sm text-foreground/40 font-medium">
                  No notifications yet
                </p>
                <p className="text-xs text-foreground/25 mt-1">
                  You're all caught up
                </p>
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const config = typeConfig[notif.type] || typeConfig.system;
                const isUnread = notif.portalStatus === "unread";

                return (
                  <div
                    key={notif.id}
                    className={`group relative flex gap-3 px-4 py-3 border-b border-white/5 transition-all duration-200 hover:bg-white/5 ${
                      isUnread ? "bg-electric/[0.04]" : ""
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-electric shadow-sm shadow-electric/50" />
                    )}

                    {/* Type icon */}
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base ${config.color}`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm leading-tight ${
                            isUnread
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/70"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-foreground/30 whitespace-nowrap flex-shrink-0 mt-0.5">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/50 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Actions row */}
                      <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate({
                                notificationId: notif.id,
                              });
                            }}
                            className="flex items-center gap-1 text-[10px] text-electric hover:text-electric/80 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Read
                          </button>
                        )}
                        {notif.linkUrl && (
                          <Link href={notif.linkUrl}>
                            <a
                              onClick={() => {
                                if (isUnread) {
                                  markAsReadMutation.mutate({
                                    notificationId: notif.id,
                                  });
                                }
                                setIsOpen(false);
                              }}
                              className="flex items-center gap-1 text-[10px] text-foreground/40 hover:text-foreground/70 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </a>
                          </Link>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate({
                              notificationId: notif.id,
                            });
                          }}
                          className="flex items-center gap-1 text-[10px] text-foreground/30 hover:text-red-400 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2.5">
              <Link href="/notifications">
                <a
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 text-xs font-medium text-foreground/50 hover:text-electric transition-colors py-1"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  View all notifications
                </a>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
