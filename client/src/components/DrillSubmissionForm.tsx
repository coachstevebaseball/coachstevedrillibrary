import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Send, AlertCircle, Video, Loader2, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useNotification } from "@/contexts/NotificationContext";

interface DrillSubmissionFormProps {
  assignmentId: number;
  drillId: string;
  onSubmitSuccess?: () => void;
}

export function DrillSubmissionForm({ assignmentId, drillId, onSubmitSuccess }: DrillSubmissionFormProps) {
  const { addToast } = useNotification();
  const [notes, setNotes] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const createSubmissionMutation = trpc.submissions.drillSubmissions.createSubmission.useMutation();

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError("Video file must be less than 100MB");
        return;
      }
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const uploadVideoViaMultipart = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("assignmentId", String(assignmentId));
    formData.append("drillId", drillId);

    const response = await fetch("/api/upload/video", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Upload failed (${response.status})`);
    }

    const result = await response.json();
    return result.videoUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);

    if (!notes.trim() && !videoFile) {
      setError("Please add notes or upload a video");
      return;
    }

    setIsSubmitting(true);

    try {
      let videoUrl: string | undefined;

      // Upload video via multipart (not base64) for large file support
      if (videoFile) {
        setUploadProgress(20);
        videoUrl = await uploadVideoViaMultipart(videoFile);
        setUploadProgress(80);
      }

      // Create submission with S3 URL (auto-triggers videoAnalysis record on server)
      await createSubmissionMutation.mutateAsync({
        assignmentId,
        drillId,
        notes: notes.trim() || undefined,
        videoUrl,
      });

      setUploadProgress(100);
      setSubmitted(true);

      // Show success toast
      addToast({
        type: 'success',
        title: 'Video Submitted!',
        message: videoFile 
          ? 'Your video has been uploaded and queued for AI analysis. Coach will review the feedback soon.'
          : 'Your drill submission has been recorded. Great work!',
      });

      // Reset form after short delay
      setTimeout(() => {
        setNotes("");
        setVideoFile(null);
        setVideoPreview(null);
        setUploadProgress(0);
        setSubmitted(false);
        onSubmitSuccess?.();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit drill";
      setError(errorMessage);
      setUploadProgress(0);
      
      // Show error toast
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center animate-in fade-in duration-300">
        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <p className="font-bold text-emerald-400 text-lg">Submitted!</p>
        <p className="text-sm text-emerald-400/70 mt-1">
          {videoFile ? "Your video is queued for analysis" : "Your work has been recorded"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
        <Video className="w-4 h-4 text-blue-400" />
        <h4 className="font-semibold text-foreground text-sm">Submit Your Work</h4>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading video...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Video Upload Area */}
        <div>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
            id={`video-input-${assignmentId}`}
            disabled={isSubmitting}
          />
          
          {!videoFile ? (
            <label
              htmlFor={`video-input-${assignmentId}`}
              className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-white/[0.12] rounded-xl cursor-pointer hover:bg-white/[0.04] hover:border-blue-500/40 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Tap to upload video
              </span>
              <span className="text-xs text-muted-foreground">
                Record or choose from library — Max 100MB
              </span>
            </label>
          ) : (
            <div className="space-y-3">
              {/* Video Preview */}
              {videoPreview && (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-48"
                    preload="metadata"
                  />
                </div>
              )}
              
              {/* File info + remove */}
              <div className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Video className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-xs text-foreground truncate">{videoFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                  disabled={isSubmitting}
                  className="text-xs text-red-400 hover:text-red-300 font-medium ml-2 shrink-0 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes (optional) */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Notes <span className="text-white/30">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any questions for Coach?"
            className="w-full h-16 bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
            disabled={isSubmitting}
            maxLength={500}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || (!notes.trim() && !videoFile)}
          className="w-full h-12 gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Submitting...'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {videoFile ? "Submit Video for Analysis" : "Submit Notes"}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
