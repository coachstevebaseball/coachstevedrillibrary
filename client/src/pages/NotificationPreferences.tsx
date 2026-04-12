import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft,
  Bell,
  Mail,
  ToggleLeft,
  ToggleRight,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PreferenceToggle {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const preferenceToggles: PreferenceToggle[] = [
  {
    key: "drillAssignments",
    label: "Drill Assignments",
    description: "When a new drill is assigned to you",
    icon: "🎯",
  },
  {
    key: "notesUpdates",
    label: "Session Notes",
    description: "When session notes are added or updated",
    icon: "📝",
  },
  {
    key: "recapUpdates",
    label: "Session Recaps",
    description: "When a session recap is posted",
    icon: "📊",
  },
  {
    key: "swingAnalysis",
    label: "Swing Analysis",
    description: "When your swing analysis is ready",
    icon: "🎬",
  },
  {
    key: "feedbackUpdates",
    label: "Coach Feedback",
    description: "When coach provides feedback on your submissions",
    icon: "💬",
  },
  {
    key: "submissionUpdates",
    label: "Submissions",
    description: "When new video submissions are received",
    icon: "📥",
  },
  {
    key: "badgeUpdates",
    label: "Badges & Achievements",
    description: "When you earn a new badge or achievement",
    icon: "🏆",
  },
  {
    key: "practicePlanUpdates",
    label: "Practice Plans",
    description: "When a practice plan is shared with you",
    icon: "📋",
  },
  {
    key: "featureAnnouncements",
    label: "Feature Announcements",
    description: "When new features are available on the platform",
    icon: "✨",
  },
  {
    key: "systemUpdates",
    label: "System Updates",
    description: "Important system notifications and alerts",
    icon: "🔔",
  },
];

export default function NotificationPreferences() {
  const { user, loading: authLoading } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Query
  const { data: savedPrefs, isLoading } =
    trpc.notifications.getPreferences.useQuery(undefined, {
      enabled: !!user,
    });

  // Mutation
  const utils = trpc.useUtils();
  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      utils.notifications.getPreferences.invalidate();
      toast.success("Notification preferences saved");
      setHasChanges(false);
    },
    onError: () => {
      toast.error("Failed to save preferences");
    },
  });

  // Initialize from saved
  useEffect(() => {
    if (savedPrefs) {
      const initial: Record<string, number> = {
        emailNotifications: savedPrefs.emailNotifications ?? 1,
      };
      for (const toggle of preferenceToggles) {
        initial[toggle.key] =
          (savedPrefs as any)[toggle.key] ?? 1;
      }
      setPrefs(initial);
    } else if (!isLoading && user) {
      // Default all on
      const defaults: Record<string, number> = {
        emailNotifications: 1,
      };
      for (const toggle of preferenceToggles) {
        defaults[toggle.key] = 1;
      }
      setPrefs(defaults);
    }
  }, [savedPrefs, isLoading, user]);

  const togglePref = (key: string) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: prev[key] === 1 ? 0 : 1 };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSave = () => {
    updateMutation.mutate(prefs);
  };

  const emailsEnabled = prefs.emailNotifications === 1;

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
            Sign in to manage preferences
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/notifications">
              <a className="p-2 rounded-lg text-foreground/40 hover:text-foreground hover:bg-white/8 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </a>
            </Link>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Notification Preferences
              </h1>
              <p className="text-sm text-foreground/40 mt-0.5">
                Control how and when you receive notifications
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Master Email Toggle */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-electric" />
                  <h2 className="font-heading font-bold text-foreground">
                    Email Notifications
                  </h2>
                </div>
                <p className="text-xs text-foreground/40 mt-1 ml-8">
                  Master toggle for all email notifications
                </p>
              </div>
              <div className="px-5 py-4">
                <button
                  onClick={() => togglePref("emailNotifications")}
                  className="flex items-center justify-between w-full group"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {emailsEnabled
                        ? "Email notifications are ON"
                        : "Email notifications are OFF"}
                    </span>
                    <p className="text-xs text-foreground/40 mt-0.5">
                      {emailsEnabled
                        ? "You'll receive email alerts for enabled notification types"
                        : "No email notifications will be sent. In-app notifications still work."}
                    </p>
                  </div>
                  {emailsEnabled ? (
                    <ToggleRight className="w-8 h-8 text-electric flex-shrink-0" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-foreground/30 flex-shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Per-Type Toggles */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-electric" />
                  <h2 className="font-heading font-bold text-foreground">
                    Notification Types
                  </h2>
                </div>
                <p className="text-xs text-foreground/40 mt-1 ml-8">
                  Choose which types of notifications you want to receive via
                  email
                </p>
              </div>
              <div className="divide-y divide-white/5">
                {preferenceToggles.map((toggle) => {
                  const enabled = prefs[toggle.key] === 1;
                  const disabled = !emailsEnabled;

                  return (
                    <button
                      key={toggle.key}
                      onClick={() => togglePref(toggle.key)}
                      disabled={disabled}
                      className={`flex items-center justify-between w-full px-5 py-3.5 transition-all ${
                        disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg flex-shrink-0">
                          {toggle.icon}
                        </span>
                        <div className="text-left min-w-0">
                          <span
                            className={`text-sm font-medium block ${
                              enabled && !disabled
                                ? "text-foreground"
                                : "text-foreground/50"
                            }`}
                          >
                            {toggle.label}
                          </span>
                          <span className="text-[11px] text-foreground/30 block mt-0.5">
                            {toggle.description}
                          </span>
                        </div>
                      </div>
                      {enabled ? (
                        <ToggleRight
                          className={`w-7 h-7 flex-shrink-0 ${
                            disabled ? "text-foreground/30" : "text-electric"
                          }`}
                        />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-foreground/20 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            {hasChanges && (
              <div className="sticky bottom-4 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-electric hover:bg-electric/90 text-white shadow-lg shadow-electric/30 px-6"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Preferences
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
