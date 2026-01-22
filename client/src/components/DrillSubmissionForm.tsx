import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Send, AlertCircle } from "lucide-react";
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

  const createSubmissionMutation = trpc.drillSubmissions.createSubmission.useMutation();
  const uploadVideoMutation = trpc.videoUpload.uploadSubmissionVideo.useMutation();

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

      // Upload video to S3 if provided
      if (videoFile) {
        setUploadProgress(10);
        
        // Read file as base64
        const reader = new FileReader();
        const fileBase64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(videoFile);
        const fileBase64 = await fileBase64Promise;
        
        setUploadProgress(30);

        // Upload to S3 via tRPC
        const uploadResult = await uploadVideoMutation.mutateAsync({
          assignmentId,
          drillId,
          fileData: fileBase64,
          fileName: videoFile.name,
          mimeType: videoFile.type,
        });

        videoUrl = uploadResult.videoUrl;
        setUploadProgress(80);
      }

      // Create submission with S3 URL
      await createSubmissionMutation.mutateAsync({
        assignmentId,
        drillId,
        notes: notes.trim() || undefined,
        videoUrl,
      });

      setUploadProgress(100);

      // Show success toast
      addToast({
        type: 'success',
        title: 'Submission Successful!',
        message: 'Your drill submission has been recorded. Great work!',
      });

      // Reset form
      setNotes("");
      setVideoFile(null);
      setVideoPreview(null);
      setUploadProgress(0);
      onSubmitSuccess?.();
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

  return (
    <Card className="border-l-4 border-l-secondary">
      <CardHeader>
        <CardTitle className="text-lg">Submit Your Work</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">Please provide either notes or a video (or both) to complete your submission</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-secondary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Notes <span className="text-amber-600 font-normal">(or video)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your performance, what you learned, or any challenges..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">Share your thoughts and progress</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Video Upload <span className="text-amber-600 font-normal">(or notes)</span></label>
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
                id="video-input"
                disabled={isSubmitting}
              />
              <label
                htmlFor="video-input"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {videoFile ? videoFile.name : "Click to upload video"}
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">MP4, WebM, or other video formats. Max 100MB.</p>

            {videoPreview && (
              <div className="mt-3 relative">
                <video
                  src={videoPreview}
                  controls
                  className="w-full rounded-lg bg-black max-h-64"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                  disabled={isSubmitting}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || (!notes.trim() && !videoFile)}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? `Submitting... ${uploadProgress > 0 ? `(${uploadProgress}%)` : ''}` : "Submit Drill Work"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
