import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Upload, Image, Loader2, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DrillEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  drill: {
    id: string;
    name: string;
    difficulty: string;
    categories: string[];
    duration: string;
  };
  customization?: {
    thumbnailUrl?: string | null;
    briefDescription?: string | null;
    difficulty?: string | null;
    category?: string | null;
  } | null;
  onSaved: () => void;
}

const CATEGORIES = [
  "Hitting",
  "Bunting",
  "Pitching",
  "Infield",
  "Outfield",
  "Catching",
  "Base Running",
  "General",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export function DrillEditModal({ isOpen, onClose, drill, customization, onSaved }: DrillEditModalProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState(customization?.thumbnailUrl || "");
  const [briefDescription, setBriefDescription] = useState(
    customization?.briefDescription || `Master this drill to improve your ${drill.categories[0]?.toLowerCase() || "baseball"} skills.`
  );
  const [difficulty, setDifficulty] = useState(customization?.difficulty || drill.difficulty);
  const [category, setCategory] = useState(customization?.category || drill.categories[0] || "General");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(customization?.thumbnailUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  // Reset form when modal opens with new drill
  useEffect(() => {
    if (isOpen) {
      setThumbnailUrl(customization?.thumbnailUrl || "");
      setBriefDescription(
        customization?.briefDescription || `Master this drill to improve your ${drill.categories[0]?.toLowerCase() || "baseball"} skills.`
      );
      setDifficulty(customization?.difficulty || drill.difficulty);
      setCategory(customization?.category || drill.categories[0] || "General");
      setPreviewUrl(customization?.thumbnailUrl || null);
    }
  }, [isOpen, drill, customization]);

  const saveMutation = trpc.drillCustomizations.save.useMutation({
    onSuccess: () => {
      toast.success("Drill card updated successfully!");
      utils.drillCustomizations.getAll.invalidate();
      onSaved();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const uploadMutation = trpc.drillCustomizations.uploadThumbnail.useMutation({
    onSuccess: (data) => {
      setThumbnailUrl(data.url);
      setPreviewUrl(data.url);
      setIsUploading(false);
      toast.success("Image uploaded successfully!");
    },
    onError: (error) => {
      setIsUploading(false);
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to base64 and upload
    const base64Reader = new FileReader();
    base64Reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(",")[1];
      uploadMutation.mutate({
        drillId: drill.id,
        imageBase64: base64,
        mimeType: file.type,
      });
    };
    base64Reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveMutation.mutate({
      drillId: drill.id,
      thumbnailUrl: thumbnailUrl || null,
      briefDescription: briefDescription || null,
      difficulty: difficulty || null,
      category: category || null,
    });
  };

  const handleRemoveImage = () => {
    setThumbnailUrl("");
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] glass-card border-white/10 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-electric animate-pulse" />
            Edit Drill Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Drill Name (read-only) */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Drill Name</Label>
            <div className="px-3 py-2 bg-muted/30 rounded-lg text-white font-medium">
              {drill.name}
            </div>
          </div>

          {/* Thumbnail Image */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Thumbnail Image</Label>
            <div className="flex gap-4">
              {/* Preview */}
              <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-muted/30 border border-white/10 flex items-center justify-center">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-red-500/80 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </>
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-electric animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1 flex flex-col justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="glass border-white/10 hover:border-electric/50 hover:bg-electric/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Image"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: 400x300px, max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Brief Description */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Brief Description</Label>
            <Textarea
              value={briefDescription}
              onChange={(e) => setBriefDescription(e.target.value)}
              placeholder="Enter a brief description for the drill card..."
              className="glass border-white/10 focus:border-electric/50 bg-muted/20 text-white placeholder:text-muted-foreground resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This appears on the drill card in the grid view
            </p>
          </div>

          {/* Difficulty & Category Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="glass border-white/10 focus:border-electric/50 bg-muted/20 text-white">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 bg-card">
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d} className="text-white hover:bg-electric/20">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            d === "Easy"
                              ? "bg-emerald-500"
                              : d === "Medium"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {d}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="glass border-white/10 focus:border-electric/50 bg-muted/20 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 bg-card">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-white hover:bg-electric/20">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="glass border-white/10 hover:border-white/30"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || isUploading}
            className="bg-electric hover:bg-electric/90 text-white"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
