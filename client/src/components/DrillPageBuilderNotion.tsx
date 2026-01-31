import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Save,
  Trash2,
  FileText,
  X,
  Sparkles,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NotionBlockEditor, NotionBlock } from "./NotionBlockEditor";

interface DrillPageBuilderNotionProps {
  drillId: string;
  drillName: string;
  onClose: () => void;
}

// Convert old block format to new Notion block format
function convertToNotionBlocks(oldBlocks: any[]): NotionBlock[] {
  return oldBlocks.map((block) => {
    const baseBlock: NotionBlock = {
      id: block.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "paragraph",
      content: "",
    };

    switch (block.type) {
      case "text":
        // Check if it was styled as a heading
        if (block.style?.fontSize === "24px" || block.style?.fontWeight === "bold") {
          baseBlock.type = "heading2";
        } else {
          baseBlock.type = "paragraph";
        }
        baseBlock.content = block.content || "";
        break;
      case "video":
        baseBlock.type = "video";
        baseBlock.url = block.url;
        break;
      case "image":
        baseBlock.type = "image";
        baseBlock.url = block.url;
        break;
      case "list":
        baseBlock.type = "bulletList";
        baseBlock.items = block.items || [""];
        break;
      case "callout":
        baseBlock.type = "callout";
        baseBlock.content = block.content || "";
        baseBlock.calloutType = "info";
        break;
      case "divider":
        baseBlock.type = "divider";
        break;
      default:
        baseBlock.content = block.content || "";
    }

    return baseBlock;
  });
}

// Convert Notion blocks back to old format for saving (backwards compatibility)
function convertFromNotionBlocks(notionBlocks: NotionBlock[]): any[] {
  return notionBlocks.map((block) => {
    const baseBlock: any = {
      id: block.id,
      type: "text",
    };

    switch (block.type) {
      case "paragraph":
        baseBlock.type = "text";
        baseBlock.content = block.content;
        baseBlock.style = { fontSize: "16px", fontWeight: "normal", textAlign: "left" };
        break;
      case "heading1":
        baseBlock.type = "text";
        baseBlock.content = block.content;
        baseBlock.style = { fontSize: "32px", fontWeight: "bold", textAlign: "left" };
        break;
      case "heading2":
        baseBlock.type = "text";
        baseBlock.content = block.content;
        baseBlock.style = { fontSize: "24px", fontWeight: "bold", textAlign: "left" };
        break;
      case "heading3":
        baseBlock.type = "text";
        baseBlock.content = block.content;
        baseBlock.style = { fontSize: "20px", fontWeight: "bold", textAlign: "left" };
        break;
      case "heading4":
        baseBlock.type = "text";
        baseBlock.content = block.content;
        baseBlock.style = { fontSize: "18px", fontWeight: "bold", textAlign: "left" };
        break;
      case "bulletList":
        baseBlock.type = "list";
        baseBlock.items = block.items;
        break;
      case "numberedList":
        baseBlock.type = "list";
        baseBlock.items = block.items;
        // Store as metadata that it's numbered
        baseBlock.listType = "numbered";
        break;
      case "quote":
        baseBlock.type = "callout";
        baseBlock.content = block.content;
        baseBlock.calloutStyle = "quote";
        break;
      case "callout":
        baseBlock.type = "callout";
        baseBlock.content = block.content;
        baseBlock.calloutType = block.calloutType;
        break;
      case "divider":
        baseBlock.type = "divider";
        break;
      case "video":
        baseBlock.type = "video";
        baseBlock.url = block.url;
        break;
      case "image":
        baseBlock.type = "image";
        baseBlock.url = block.url;
        break;
      default:
        baseBlock.content = block.content;
    }

    return baseBlock;
  });
}

export function DrillPageBuilderNotion({
  drillId,
  drillName,
  onClose,
}: DrillPageBuilderNotionProps) {
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch existing layout
  const { data: existingLayout } = trpc.drillDetails.getPageLayout.useQuery({
    drillId,
  });
  const saveLayoutMutation = trpc.drillDetails.savePageLayout.useMutation();
  const deleteLayoutMutation = trpc.drillDetails.deletePageLayout.useMutation();

  // Template functionality
  const { data: templates } = trpc.drillDetails.getTemplates.useQuery();
  const createTemplateMutation = trpc.drillDetails.createTemplate.useMutation();
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  useEffect(() => {
    if (existingLayout?.blocks) {
      // Convert old format to new Notion format
      const convertedBlocks = convertToNotionBlocks(
        existingLayout.blocks as any[]
      );
      setBlocks(convertedBlocks);
    }
  }, [existingLayout]);

  const handleSave = async () => {
    try {
      // Convert back to old format for backwards compatibility
      const oldFormatBlocks = convertFromNotionBlocks(blocks);
      await saveLayoutMutation.mutateAsync({
        drillId,
        blocks: oldFormatBlocks,
      });
      toast.success("Drill page layout saved successfully!");
    } catch (error) {
      toast.error("Failed to save layout");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this custom layout? The drill will revert to the default view."
      )
    ) {
      return;
    }
    try {
      await deleteLayoutMutation.mutateAsync({ drillId });
      setBlocks([]);
      toast.success("Custom layout deleted");
    } catch (error) {
      toast.error("Failed to delete layout");
      console.error(error);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    try {
      const oldFormatBlocks = convertFromNotionBlocks(blocks);
      await createTemplateMutation.mutateAsync({
        name: templateName,
        description: templateDescription,
        blocks: oldFormatBlocks,
      });
      toast.success("Template saved successfully!");
      setShowTemplateDialog(false);
      setTemplateName("");
      setTemplateDescription("");
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    }
  };

  const handleLoadTemplate = (templateBlocks: any[]) => {
    const convertedBlocks = convertToNotionBlocks(templateBlocks);
    setBlocks(convertedBlocks);
    toast.success("Template loaded");
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto">
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-electric-blue to-purple-500 flex items-center justify-center">
              <Edit3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Page Builder
                <span className="text-xs bg-electric-blue/20 text-electric-blue px-2 py-0.5 rounded-full">
                  Notion-style
                </span>
              </h1>
              <p className="text-muted-foreground text-sm">{drillName}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="glass-card rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            {templates && templates.length > 0 && (
              <Select
                onValueChange={(value) => {
                  const template = templates.find(
                    (t) => t.id === parseInt(value)
                  );
                  if (template) handleLoadTemplate(template.blocks as any[]);
                }}
              >
                <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Load Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id.toString()}
                    >
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateDialog(true)}
              disabled={blocks.length === 0}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <FileText className="h-4 w-4 mr-2" />
              Save Template
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className={
                previewMode
                  ? "bg-electric-blue/20 border-electric-blue text-electric-blue"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? "Editing" : "Preview"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saveLayoutMutation.isPending}
              className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveLayoutMutation.isPending ? "Saving..." : "Save"}
            </Button>

            {blocks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteLayoutMutation.isPending}
                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="glass-card rounded-xl overflow-hidden">
          {!previewMode && (
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-electric-blue" />
                Type <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">/</kbd> for
                commands, or use markdown shortcuts like{" "}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">#</kbd>,{" "}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">-</kbd>,{" "}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">1.</kbd>
              </p>
            </div>
          )}

          <NotionBlockEditor
            blocks={blocks}
            onChange={setBlocks}
            readOnly={previewMode}
          />
        </div>

        {/* Template Save Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>
                Save this layout as a reusable template for future drills.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Video + Steps Layout"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="template-description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe when to use this template..."
                  rows={3}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTemplateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAsTemplate}
                disabled={createTemplateMutation.isPending}
                className="bg-electric-blue hover:bg-electric-blue/80"
              >
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default DrillPageBuilderNotion;
