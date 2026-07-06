import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Search, Check, X, ExternalLink, Edit2, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useAllDrills } from "@/hooks/useAllDrills";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type VideoFilter = "all" | "with-video" | "without-video";

export function ManageDrillVideos({ embedded = false }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [videoFilter, setVideoFilter] = useState<VideoFilter>("all");
  const [drillVideos, setDrillVideos] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  // Load all videos from database on mount
  const { data: videosData } = trpc.videos.getAllVideos.useQuery();
  
  useEffect(() => {
    if (videosData) {
      const videoMap: Record<string, string> = {};
      videosData.forEach((v: any) => {
        videoMap[v.drillId] = v.videoUrl;
      });
      setDrillVideos(videoMap);
      setIsLoading(false);
    }
  }, [videosData]);

  const allDrills = useAllDrills();

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("All");
    allDrills.forEach(drill => {
      drill.categories.forEach(cat => cats.add(cat));
    });
    return Array.from(cats).sort();
  }, [allDrills]);

  // Filter drills
  const filteredDrills = useMemo(() => {
    return allDrills.filter(drill => {
      const matchesSearch = drill.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || drill.categories.includes(selectedCategory);
      const hasVideo = !!drillVideos[drill.id];
      const matchesVideoFilter = videoFilter === "all" || 
        (videoFilter === "with-video" && hasVideo) || 
        (videoFilter === "without-video" && !hasVideo);
      return matchesSearch && matchesCategory && matchesVideoFilter;
    });
  }, [allDrills, searchTerm, selectedCategory, videoFilter, drillVideos]);

  // Stats
  const withVideoCount = allDrills.filter(d => !!drillVideos[d.id]).length;
  const withoutVideoCount = allDrills.length - withVideoCount;

  const saveVideoMutation = trpc.videos.saveVideo.useMutation();
  
  const handleSaveVideo = (drillId: string, videoUrl: string) => {
    saveVideoMutation.mutate(
      { drillId, videoUrl },
      {
        onSuccess: () => {
          const updated = { ...drillVideos, [drillId]: videoUrl };
          setDrillVideos(updated);
          setEditingDrillId(null);
          setEditUrl("");
          toast.success("Video URL saved");
        },
        onError: (error) => {
          toast.error(`Failed to save: ${error.message}`);
        },
      }
    );
  };

  const handleRemoveVideo = (drillId: string) => {
    saveVideoMutation.mutate(
      { drillId, videoUrl: "" },
      {
        onSuccess: () => {
          const updated = { ...drillVideos };
          delete updated[drillId];
          setDrillVideos(updated);
          toast.success("Video removed");
        },
        onError: (error) => {
          toast.error(`Failed to remove: ${error.message}`);
        },
      }
    );
  };

  const startEditing = (drillId: string) => {
    setEditingDrillId(drillId);
    setEditUrl(drillVideos[drillId] || "");
  };

  const cancelEditing = () => {
    setEditingDrillId(null);
    setEditUrl("");
  };

  if (!user || (user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Only coaches and admins can manage drill videos.</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && (
        <header className="bg-brand-header text-brand-header-foreground py-6 mb-8">
          <div className="container">
            <Link href="/coach-dashboard">
              <Button variant="ghost" className="text-brand-header-foreground/80 hover:text-brand-header-foreground hover:bg-brand-header-foreground/10 mb-4 pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Coach Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8" />
              <h1 className="text-4xl font-heading font-black">Manage Drill Videos</h1>
            </div>
            <p className="text-brand-header-foreground/80 mt-2">Add instructional videos to your drills</p>
          </div>
        </header>
      )}

      <div className={embedded ? "space-y-4" : "container max-w-6xl space-y-4 pb-12"}>
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{allDrills.length}</p>
            <p className="text-xs text-muted-foreground">Total Drills</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{withVideoCount}</p>
            <p className="text-xs text-muted-foreground">With Video</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{withoutVideoCount}</p>
            <p className="text-xs text-muted-foreground">Missing Video</p>
          </div>
        </div>

        {/* Search, Filter, and Video Status Filter */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drills by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/[0.08]"
              />
            </div>
            <div className="flex gap-2">
              {([
                { key: "all" as VideoFilter, label: "All" },
                { key: "with-video" as VideoFilter, label: "Has Video" },
                { key: "without-video" as VideoFilter, label: "No Video" },
              ]).map(f => (
                <Button
                  key={f.key}
                  variant={videoFilter === f.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVideoFilter(f.key)}
                  className="text-xs whitespace-nowrap"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            {categories.slice(0, 12).map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "ghost"}
                onClick={() => setSelectedCategory(cat)}
                size="sm"
                className="text-[11px] h-7 px-2"
              >
                {cat}
              </Button>
            ))}
            {categories.length > 12 && (
              <Button variant="ghost" size="sm" className="text-[11px] h-7 px-2 text-muted-foreground">
                +{categories.length - 12} more
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground px-1">
          Showing {filteredDrills.length} of {allDrills.length} drills
        </p>

        {/* Compact Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading drills...</div>
          ) : filteredDrills.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Video className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No drills match your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredDrills.map((drill) => {
                const hasVideo = !!drillVideos[drill.id];
                const isEditing = editingDrillId === drill.id;

                return (
                  <div
                    key={drill.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Status indicator */}
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${hasVideo ? "bg-green-400" : "bg-white/20"}`} />

                    {/* Drill info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{drill.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {drill.categories.slice(0, 2).map(cat => (
                          <span key={cat} className="text-[10px] text-muted-foreground bg-white/[0.06] px-1.5 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                        {drill.categories.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{drill.categories.length - 2}</span>
                        )}
                      </div>
                    </div>

                    {/* Video status / edit */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="YouTube or Vimeo URL..."
                            className="w-64 h-8 text-xs bg-white/[0.06] border-white/[0.1]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && editUrl.trim()) handleSaveVideo(drill.id, editUrl.trim());
                              if (e.key === "Escape") cancelEditing();
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-8 px-2"
                            disabled={!editUrl.trim() || saveVideoMutation.isPending}
                            onClick={() => handleSaveVideo(drill.id, editUrl.trim())}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={cancelEditing}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : hasVideo ? (
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20 gap-1">
                            <Video className="h-2.5 w-2.5" />
                            Video
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-400"
                            onClick={() => window.open(drillVideos[drill.id], "_blank")}
                            title="Open video"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                            onClick={() => startEditing(drill.id)}
                            title="Edit video URL"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                            onClick={() => handleRemoveVideo(drill.id)}
                            title="Remove video"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 border-dashed border-white/20 text-muted-foreground hover:text-white"
                          onClick={() => startEditing(drill.id)}
                        >
                          <Video className="h-3 w-3" />
                          Add Video
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
