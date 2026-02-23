import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Users, Activity, TrendingUp, Zap, Target,
  ChevronRight, BarChart3, Gauge, Timer, Crosshair, Plus, UserPlus, Trash2
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";
import { AddBlastSession } from "./AddBlastSession";
import { AddBlastPlayer } from "./AddBlastPlayer";
import { DeleteBlastSession } from "./DeleteBlastSession";

// Metric display config
const METRIC_CONFIGS = {
  batSpeed: { label: "Bat Speed", unit: "mph", key: "batSpeedMph", color: "#3b82f6", icon: Zap },
  rotAccel: { label: "Rotational Accel", unit: "g", key: "rotationalAccelerationG", color: "#8b5cf6", icon: Activity },
  planeScore: { label: "Plane Score", unit: "", key: "planeScore", color: "#10b981", icon: Target },
  connectionScore: { label: "Connection Score", unit: "", key: "connectionScore", color: "#f59e0b", icon: Crosshair },
  rotationScore: { label: "Rotation Score", unit: "", key: "rotationScore", color: "#ef4444", icon: Gauge },
  power: { label: "Power", unit: "kW", key: "powerKw", color: "#ec4899", icon: Zap },
  peakHandSpeed: { label: "Peak Hand Speed", unit: "mph", key: "peakHandSpeedMph", color: "#06b6d4", icon: TrendingUp },
  attackAngle: { label: "Attack Angle", unit: "deg", key: "attackAngleDeg", color: "#84cc16", icon: Target },
  onPlaneEff: { label: "On-Plane Efficiency", unit: "%", key: "onPlaneEfficiencyPercent", color: "#14b8a6", icon: BarChart3 },
  timeToContact: { label: "Time to Contact", unit: "sec", key: "timeToContactSec", color: "#f97316", icon: Timer },
} as const;

type MetricKey = keyof typeof METRIC_CONFIGS;

// Score color helper
function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 55) return "text-yellow-400";
  return "text-red-400";
}

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f36] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-white/60 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function BlastMetricsTab() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [sessionTypeFilter, setSessionTypeFilter] = useState("All");
  const [chartMetric1, setChartMetric1] = useState<MetricKey>("batSpeed");
  const [chartMetric2, setChartMetric2] = useState<MetricKey>("rotAccel");
  const [chartView, setChartView] = useState<"line" | "bar">("line");

  // Dialog states
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [deleteSession, setDeleteSession] = useState<{
    id: string;
    date: string;
    type: string;
  } | null>(null);

  const { data: players = [], isLoading: playersLoading } = trpc.blastMetrics.listPlayers.useQuery();

  const { data: player } = trpc.blastMetrics.getPlayer.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );

  const { data: sessions = [], isLoading: sessionsLoading } = trpc.blastMetrics.getPlayerSessions.useQuery(
    { playerId: selectedPlayerId!, sessionType: sessionTypeFilter === "All" ? undefined : sessionTypeFilter },
    { enabled: !!selectedPlayerId }
  );

  const { data: sessionTypes = [] } = trpc.blastMetrics.getSessionTypes.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );

  const { data: trends = [] } = trpc.blastMetrics.getTrends.useQuery(
    { playerId: selectedPlayerId!, sessionType: sessionTypeFilter === "All" ? undefined : sessionTypeFilter },
    { enabled: !!selectedPlayerId }
  );

  const { data: averages = [] } = trpc.blastMetrics.getAverages.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );

  // Prepare chart data
  const chartData = useMemo(() => {
    return trends.map((t: any) => ({
      date: formatShortDate(t.sessionDate),
      sessionType: t.sessionType,
      batSpeedMph: t.batSpeedMph ? parseFloat(t.batSpeedMph) : null,
      rotationalAccelerationG: t.rotationalAccelerationG ? parseFloat(t.rotationalAccelerationG) : null,
      planeScore: t.planeScore,
      connectionScore: t.connectionScore,
      rotationScore: t.rotationScore,
      powerKw: t.powerKw ? parseFloat(t.powerKw) : null,
      peakHandSpeedMph: t.peakHandSpeedMph ? parseFloat(t.peakHandSpeedMph) : null,
      attackAngleDeg: t.attackAngleDeg ? parseFloat(t.attackAngleDeg) : null,
      onPlaneEfficiencyPercent: t.onPlaneEfficiencyPercent ? parseFloat(t.onPlaneEfficiencyPercent) : null,
      timeToContactSec: t.timeToContactSec ? parseFloat(t.timeToContactSec) : null,
    }));
  }, [trends]);

  // Calculate overall averages for the summary cards
  const overallAvgs = useMemo(() => {
    if (!sessions.length) return null;
    const validSessions = sessions.filter((s: any) => s.batSpeedMph);
    if (!validSessions.length) return null;
    const sum = (key: string) => validSessions.reduce((acc: number, s: any) => acc + (parseFloat(s[key]) || 0), 0);
    const avg = (key: string) => sum(key) / validSessions.length;
    return {
      batSpeed: avg("batSpeedMph"),
      rotAccel: avg("rotationalAccelerationG"),
      planeScore: Math.round(avg("planeScore")),
      connectionScore: Math.round(avg("connectionScore")),
      rotationScore: Math.round(avg("rotationScore")),
      power: avg("powerKw"),
    };
  }, [sessions]);

  // ========== PLAYER ROSTER VIEW ==========
  if (!selectedPlayerId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                <Activity className="h-5 w-5 text-violet-400" />
              </div>
              Blast Motion Metrics
            </h2>
            <p className="text-white/50 mt-1">Track swing metrics and identify trends across your players</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAddPlayerOpen(true)}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add Player
            </Button>
            <Badge variant="outline" className="text-white/60 border-white/10">
              {players.length} Players
            </Badge>
          </div>
        </div>

        {playersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <Card className="bg-white/[0.04] border-white/[0.08]">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/80 mb-2">No Players Yet</h3>
              <p className="text-white/40 max-w-md mx-auto mb-6">
                Add players and their Blast Motion session data to start tracking swing metrics.
              </p>
              <Button
                onClick={() => setAddPlayerOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Player
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                className="group text-left rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/30 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center border border-white/10 text-white font-bold text-sm">
                      {p.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                        {p.fullName}
                      </h3>
                      <p className="text-xs text-white/40">
                        {p.sessionCount} session{p.sessionCount !== 1 ? "s" : ""}
                      </p>
                      {p.portalName && (
                        <p className="text-xs text-green-400/70 mt-0.5 flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"></span>
                          Linked: {p.portalEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-violet-400 transition-all group-hover:translate-x-1" />
                </div>
                {p.latestSession && (
                  <p className="text-xs text-white/30">
                    Last session: {formatDate(p.latestSession)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Add Player Dialog */}
        <AddBlastPlayer open={addPlayerOpen} onOpenChange={setAddPlayerOpen} />
      </div>
    );
  }

  // ========== PLAYER DETAIL DASHBOARD ==========
  const metric1Config = METRIC_CONFIGS[chartMetric1];
  const metric2Config = METRIC_CONFIGS[chartMetric2];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPlayerId(null);
              setSessionTypeFilter("All");
            }}
            className="text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Players
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <h2 className="text-xl font-heading font-bold text-white">
              {player?.fullName || "Loading..."}
            </h2>
            {player?.portalEmail && (
              <p className="text-xs text-green-400/60 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"></span>
                Portal: {player.portalEmail}
                {player.blastEmail && <span className="text-white/30">| Blast: {player.blastEmail}</span>}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => setAddSessionOpen(true)}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Session
        </Button>
      </div>

      {/* Summary Score Cards */}
      {overallAvgs && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Bat Speed", value: `${overallAvgs.batSpeed.toFixed(1)}`, unit: "mph", color: "from-blue-500/20 to-blue-600/20", borderColor: "border-blue-500/20" },
            { label: "Rot. Accel", value: `${overallAvgs.rotAccel.toFixed(1)}`, unit: "g", color: "from-violet-500/20 to-violet-600/20", borderColor: "border-violet-500/20" },
            { label: "Plane", value: `${overallAvgs.planeScore}`, unit: "", color: "from-green-500/20 to-green-600/20", borderColor: "border-green-500/20" },
            { label: "Connection", value: `${overallAvgs.connectionScore}`, unit: "", color: "from-yellow-500/20 to-yellow-600/20", borderColor: "border-yellow-500/20" },
            { label: "Rotation", value: `${overallAvgs.rotationScore}`, unit: "", color: "from-red-500/20 to-red-600/20", borderColor: "border-red-500/20" },
            { label: "Power", value: `${overallAvgs.power.toFixed(2)}`, unit: "kW", color: "from-pink-500/20 to-pink-600/20", borderColor: "border-pink-500/20" },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl bg-gradient-to-br ${card.color} border ${card.borderColor} p-4 text-center`}
            >
              <p className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-white">
                {card.value}
                {card.unit && <span className="text-sm font-normal text-white/40 ml-1">{card.unit}</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters & Chart Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
            <SelectTrigger className="w-[200px] bg-white/[0.06] border-white/[0.1] text-white">
              <SelectValue placeholder="Session Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Session Types</SelectItem>
              {sessionTypes.map((type: string) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          <Select value={chartMetric1} onValueChange={(v) => setChartMetric1(v as MetricKey)}>
            <SelectTrigger className="w-[160px] bg-white/[0.06] border-white/[0.1] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METRIC_CONFIGS).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-white/30 text-xs">vs</span>
          <Select value={chartMetric2} onValueChange={(v) => setChartMetric2(v as MetricKey)}>
            <SelectTrigger className="w-[160px] bg-white/[0.06] border-white/[0.1] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METRIC_CONFIGS).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex bg-white/[0.06] rounded-lg border border-white/[0.08] p-0.5">
            <button
              onClick={() => setChartView("line")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                chartView === "line" ? "bg-white/[0.12] text-white" : "text-white/40 hover:text-white/60"
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartView("bar")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                chartView === "bar" ? "bg-white/[0.12] text-white" : "text-white/40 hover:text-white/60"
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-white/30 gap-3">
              <p>No session data available for the selected filters</p>
              <Button
                onClick={() => setAddSessionOpen(true)}
                size="sm"
                variant="outline"
                className="text-violet-400 border-violet-500/30 hover:bg-violet-500/10"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add First Session
              </Button>
            </div>
          ) : (
            <div className="h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === "line" ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id={`grad-${chartMetric1}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metric1Config.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={metric1Config.color} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id={`grad-${chartMetric2}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metric2Config.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={metric2Config.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                    <YAxis yAxisId="left" stroke={metric1Config.color} fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke={metric2Config.color} fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey={metric1Config.key}
                      name={`${metric1Config.label} (${metric1Config.unit})`}
                      stroke={metric1Config.color}
                      fill={`url(#grad-${chartMetric1})`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: metric1Config.color }}
                      activeDot={{ r: 6 }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey={metric2Config.key}
                      name={`${metric2Config.label} (${metric2Config.unit})`}
                      stroke={metric2Config.color}
                      fill={`url(#grad-${chartMetric2})`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: metric2Config.color }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                    <YAxis yAxisId="left" stroke={metric1Config.color} fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke={metric2Config.color} fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }} />
                    <Bar
                      yAxisId="left"
                      dataKey={metric1Config.key}
                      name={`${metric1Config.label} (${metric1Config.unit})`}
                      fill={metric1Config.color}
                      radius={[4, 4, 0, 0]}
                      opacity={0.8}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey={metric2Config.key}
                      name={`${metric2Config.label} (${metric2Config.unit})`}
                      fill={metric2Config.color}
                      radius={[4, 4, 0, 0]}
                      opacity={0.8}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Averages by Session Type */}
      {averages.length > 0 && (
        <Card className="bg-white/[0.04] border-white/[0.08]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Averages by Session Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-3 text-white/50 font-medium">Session Type</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Sessions</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Bat Speed</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Rot. Accel</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Plane</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Connection</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Rotation</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Power</th>
                  </tr>
                </thead>
                <tbody>
                  {averages.map((avg: any, idx: number) => (
                    <tr key={avg.sessionType || idx} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-white/70 border-white/10 font-normal">
                          {avg.sessionType}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-2 text-white/60">{avg.sessionCount}</td>
                      <td className="text-center py-3 px-2 text-blue-400 font-medium">{avg.avgBatSpeed} mph</td>
                      <td className="text-center py-3 px-2 text-violet-400 font-medium">{avg.avgRotAccel} g</td>
                      <td className="text-center py-3 px-2">
                        <span className={getScoreColor(avg.avgPlaneScore)}>{avg.avgPlaneScore}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={getScoreColor(avg.avgConnectionScore)}>{avg.avgConnectionScore}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={getScoreColor(avg.avgRotationScore)}>{avg.avgRotationScore}</span>
                      </td>
                      <td className="text-center py-3 px-2 text-pink-400 font-medium">{avg.avgPower} kW</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History Table */}
      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              Session History
              <Badge variant="outline" className="text-white/40 border-white/10 ml-2 font-normal">
                {sessions.length} sessions
              </Badge>
            </CardTitle>
            <Button
              onClick={() => setAddSessionOpen(true)}
              size="sm"
              variant="outline"
              className="text-violet-400 border-violet-500/30 hover:bg-violet-500/10 h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-white/30 space-y-3">
              <p>No sessions found for the selected filters</p>
              <Button
                onClick={() => setAddSessionOpen(true)}
                size="sm"
                variant="outline"
                className="text-violet-400 border-violet-500/30 hover:bg-violet-500/10"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Session
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-3 text-white/50 font-medium">Date</th>
                    <th className="text-left py-3 px-2 text-white/50 font-medium">Type</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Bat Speed</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Rot. Accel</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Plane</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Connection</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Rotation</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Power</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Efficiency</th>
                    <th className="text-center py-3 px-2 text-white/50 font-medium">Attack Angle</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any, idx: number) => (
                    <tr key={s.id || idx} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 px-3 text-white/80 whitespace-nowrap">{formatDate(s.sessionDate)}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-white/60 border-white/10 font-normal text-xs">
                          {s.sessionType}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-2 text-blue-400 font-medium">
                        {s.batSpeedMph ? `${parseFloat(s.batSpeedMph).toFixed(1)}` : "—"}
                      </td>
                      <td className="text-center py-3 px-2 text-violet-400 font-medium">
                        {s.rotationalAccelerationG ? `${parseFloat(s.rotationalAccelerationG).toFixed(1)}` : "—"}
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={getScoreColor(s.planeScore)}>{s.planeScore ?? "—"}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={getScoreColor(s.connectionScore)}>{s.connectionScore ?? "—"}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={getScoreColor(s.rotationScore)}>{s.rotationScore ?? "—"}</span>
                      </td>
                      <td className="text-center py-3 px-2 text-pink-400 font-medium">
                        {s.powerKw ? `${parseFloat(s.powerKw).toFixed(2)}` : "—"}
                      </td>
                      <td className="text-center py-3 px-2 text-teal-400">
                        {s.onPlaneEfficiencyPercent ? `${parseFloat(s.onPlaneEfficiencyPercent).toFixed(1)}%` : "—"}
                      </td>
                      <td className="text-center py-3 px-2 text-lime-400">
                        {s.attackAngleDeg ? `${parseFloat(s.attackAngleDeg).toFixed(1)}°` : "—"}
                      </td>
                      <td className="py-3 px-1">
                        <button
                          onClick={() => setDeleteSession({
                            id: s.id,
                            date: formatDate(s.sessionDate),
                            type: s.sessionType || "Unknown",
                          })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-500/10 text-white/30 hover:text-red-400"
                          title="Delete session"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Session Dialog */}
      {selectedPlayerId && player && (
        <AddBlastSession
          open={addSessionOpen}
          onOpenChange={setAddSessionOpen}
          playerId={selectedPlayerId}
          playerName={player.fullName}
        />
      )}

      {/* Delete Session Dialog */}
      {deleteSession && player && (
        <DeleteBlastSession
          open={!!deleteSession}
          onOpenChange={(open) => { if (!open) setDeleteSession(null); }}
          sessionId={deleteSession.id}
          sessionDate={deleteSession.date}
          sessionType={deleteSession.type}
          playerName={player.fullName}
        />
      )}
    </div>
  );
}
