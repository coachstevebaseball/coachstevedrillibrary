import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Video,
  Image as ImageIcon,
  Minus,
  AlertCircle,
  Quote,
  GripVertical,
  Trash2,
  Plus,
  Copy,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Block type definitions
export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "bulletList"
  | "numberedList"
  | "video"
  | "image"
  | "divider"
  | "callout"
  | "quote";

export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  items?: string[];
  url?: string;
  calloutType?: "info" | "warning" | "success" | "error";
}

interface BlockTypeOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const BLOCK_TYPES: BlockTypeOption[] = [
  {
    type: "paragraph",
    label: "Text",
    description: "Just start writing with plain text",
    icon: <Type className="h-4 w-4" />,
  },
  {
    type: "heading1",
    label: "Heading 1",
    description: "Big section heading",
    icon: <Heading1 className="h-4 w-4" />,
    shortcut: "#",
  },
  {
    type: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="h-4 w-4" />,
    shortcut: "##",
  },
  {
    type: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="h-4 w-4" />,
    shortcut: "###",
  },
  {
    type: "heading4",
    label: "Heading 4",
    description: "Smallest section heading",
    icon: <Heading4 className="h-4 w-4" />,
    shortcut: "####",
  },
  {
    type: "bulletList",
    label: "Bulleted List",
    description: "Create a simple bulleted list",
    icon: <List className="h-4 w-4" />,
    shortcut: "-",
  },
  {
    type: "numberedList",
    label: "Numbered List",
    description: "Create a numbered list",
    icon: <ListOrdered className="h-4 w-4" />,
    shortcut: "1.",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Capture a quote",
    icon: <Quote className="h-4 w-4" />,
    shortcut: ">",
  },
  {
    type: "callout",
    label: "Callout",
    description: "Make writing stand out",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visually divide blocks",
    icon: <Minus className="h-4 w-4" />,
    shortcut: "---",
  },
  {
    type: "video",
    label: "Video",
    description: "Embed a YouTube video",
    icon: <Video className="h-4 w-4" />,
  },
  {
    type: "image",
    label: "Image",
    description: "Upload or embed an image",
    icon: <ImageIcon className="h-4 w-4" />,
  },
];

interface NotionBlockEditorProps {
  blocks: NotionBlock[];
  onChange: (blocks: NotionBlock[]) => void;
  readOnly?: boolean;
}

// Slash command menu component
function SlashMenu({
  isOpen,
  position,
  searchQuery,
  onSelect,
  onClose,
  selectedIndex,
}: {
  isOpen: boolean;
  position: { top: number; left: number };
  searchQuery: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  selectedIndex: number;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredTypes = BLOCK_TYPES.filter(
    (bt) =>
      bt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bt.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || filteredTypes.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 glass-card rounded-lg shadow-xl border border-white/10 overflow-hidden animate-fade-in-up"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2 border-b border-white/10">
        <span className="text-xs text-muted-foreground font-medium">
          BASIC BLOCKS
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {filteredTypes.map((bt, index) => (
          <button
            key={bt.type}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
              index === selectedIndex
                ? "bg-electric-blue/20 text-white"
                : "hover:bg-white/5 text-foreground"
            )}
            onClick={() => onSelect(bt.type)}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-white/10 flex items-center justify-center">
              {bt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{bt.label}</div>
              <div className="text-xs text-muted-foreground truncate">
                {bt.description}
              </div>
            </div>
            {bt.shortcut && (
              <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                {bt.shortcut}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Individual block component
function BlockItem({
  block,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAddBelow,
  onDragStart,
  onDragOver,
  onDragEnd,
  onKeyDown,
  readOnly,
}: {
  block: NotionBlock;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<NotionBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddBelow: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  readOnly?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleContentChange = useCallback(() => {
    if (contentRef.current) {
      onUpdate({ content: contentRef.current.innerText });
    }
  }, [onUpdate]);

  const handleListItemChange = (itemIndex: number, value: string) => {
    const newItems = [...(block.items || [])];
    newItems[itemIndex] = value;
    onUpdate({ items: newItems });
  };

  const addListItem = () => {
    onUpdate({ items: [...(block.items || []), ""] });
  };

  const removeListItem = (itemIndex: number) => {
    const newItems = (block.items || []).filter((_, i) => i !== itemIndex);
    onUpdate({ items: newItems.length > 0 ? newItems : [""] });
  };

  // Render different block types
  const renderBlockContent = () => {
    if (readOnly) {
      return renderReadOnlyContent();
    }

    switch (block.type) {
      case "paragraph":
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dir="ltr"
            className="outline-none min-h-[1.5em] text-foreground leading-relaxed"
            onInput={handleContentChange}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={onKeyDown}
            data-placeholder="Type '/' for commands..."
          >
            {block.content}
          </div>
        );

      case "heading1":
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dir="ltr"
            className="outline-none min-h-[1.5em] text-3xl font-bold text-foreground"
            onInput={handleContentChange}
            onKeyDown={onKeyDown}
            data-placeholder="Heading 1"
          >
            {block.content}
          </div>
        );

      case "heading2":
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dir="ltr"
            className="outline-none min-h-[1.5em] text-2xl font-bold text-foreground"
            onInput={handleContentChange}
            onKeyDown={onKeyDown}
            data-placeholder="Heading 2"
          >
            {block.content}
          </div>
        );

      case "heading3":
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dir="ltr"
            className="outline-none min-h-[1.5em] text-xl font-semibold text-foreground"
            onInput={handleContentChange}
            onKeyDown={onKeyDown}
            data-placeholder="Heading 3"
          >
            {block.content}
          </div>
        );

      case "heading4":
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dir="ltr"
            className="outline-none min-h-[1.5em] text-lg font-semibold text-foreground"
            onInput={handleContentChange}
            onKeyDown={onKeyDown}
            data-placeholder="Heading 4"
          >
            {block.content}
          </div>
        );

      case "bulletList":
        return (
          <ul className="space-y-1 list-none">
            {(block.items || [""]).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 group">
                <span className="text-electric-blue mt-1.5">•</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleListItemChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addListItem();
                    } else if (e.key === "Backspace" && item === "" && (block.items?.length || 0) > 1) {
                      e.preventDefault();
                      removeListItem(idx);
                    }
                  }}
                  className="flex-1 bg-transparent outline-none text-foreground"
                  placeholder="List item..."
                />
                <button
                  onClick={() => removeListItem(idx)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
            <button
              onClick={addListItem}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-4"
            >
              <Plus className="h-3 w-3" /> Add item
            </button>
          </ul>
        );

      case "numberedList":
        return (
          <ol className="space-y-1 list-none">
            {(block.items || [""]).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 group">
                <span className="text-electric-blue font-medium min-w-[1.5rem]">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleListItemChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addListItem();
                    } else if (e.key === "Backspace" && item === "" && (block.items?.length || 0) > 1) {
                      e.preventDefault();
                      removeListItem(idx);
                    }
                  }}
                  className="flex-1 bg-transparent outline-none text-foreground"
                  placeholder="List item..."
                />
                <button
                  onClick={() => removeListItem(idx)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
            <button
              onClick={addListItem}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-6"
            >
              <Plus className="h-3 w-3" /> Add item
            </button>
          </ol>
        );

      case "quote":
        return (
          <div className="border-l-4 border-electric-blue pl-4">
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              className="outline-none min-h-[1.5em] text-foreground/80 italic"
              onInput={handleContentChange}
              onKeyDown={onKeyDown}
              data-placeholder="Enter a quote..."
            >
              {block.content}
            </div>
          </div>
        );

      case "callout":
        const calloutStyles = {
          info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
          warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
          success: "bg-green-500/10 border-green-500/30 text-green-400",
          error: "bg-red-500/10 border-red-500/30 text-red-400",
        };
        const calloutType = block.calloutType || "info";
        return (
          <div className={cn("rounded-lg border p-4", calloutStyles[calloutType])}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  dir="ltr"
                  className="outline-none min-h-[1.5em]"
                  onInput={handleContentChange}
                  onKeyDown={onKeyDown}
                  data-placeholder="Type something..."
                >
                  {block.content}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 ml-8">
              {(["info", "warning", "success", "error"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate({ calloutType: type })}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded capitalize",
                    calloutType === type
                      ? "bg-white/20"
                      : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        );

      case "divider":
        return <hr className="border-white/10 my-2" />;

      case "video":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.url || ""}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="Paste YouTube URL..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground outline-none focus:border-electric-blue transition-colors"
            />
            {block.url && renderVideoPreview(block.url)}
          </div>
        );

      case "image":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.url || ""}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="Paste image URL..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground outline-none focus:border-electric-blue transition-colors"
            />
            {block.url && (
              <img
                src={block.url}
                alt="Block image"
                className="max-w-full rounded-lg"
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderReadOnlyContent = () => {
    switch (block.type) {
      case "paragraph":
        return <p className="text-foreground leading-relaxed">{block.content}</p>;
      case "heading1":
        return <h1 className="text-3xl font-bold text-foreground">{block.content}</h1>;
      case "heading2":
        return <h2 className="text-2xl font-bold text-foreground">{block.content}</h2>;
      case "heading3":
        return <h3 className="text-xl font-semibold text-foreground">{block.content}</h3>;
      case "heading4":
        return <h4 className="text-lg font-semibold text-foreground">{block.content}</h4>;
      case "bulletList":
        return (
          <ul className="space-y-1">
            {(block.items || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-electric-blue mt-1.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      case "numberedList":
        return (
          <ol className="space-y-1">
            {(block.items || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-electric-blue font-medium min-w-[1.5rem]">{idx + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        );
      case "quote":
        return (
          <blockquote className="border-l-4 border-electric-blue pl-4 text-foreground/80 italic">
            {block.content}
          </blockquote>
        );
      case "callout":
        const calloutStyles = {
          info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
          warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
          success: "bg-green-500/10 border-green-500/30 text-green-400",
          error: "bg-red-500/10 border-red-500/30 text-red-400",
        };
        return (
          <div className={cn("rounded-lg border p-4", calloutStyles[block.calloutType || "info"])}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{block.content}</span>
            </div>
          </div>
        );
      case "divider":
        return <hr className="border-white/10 my-4" />;
      case "video":
        return block.url ? renderVideoPreview(block.url) : null;
      case "image":
        return block.url ? (
          <img src={block.url} alt="Block image" className="max-w-full rounded-lg" />
        ) : null;
      default:
        return null;
    }
  };

  const renderVideoPreview = (url: string) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) return <p className="text-red-400 text-sm">Invalid YouTube URL</p>;
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full"
          allowFullScreen
        />
      </div>
    );
  };

  if (readOnly) {
    return (
      <div className="py-1">
        {renderBlockContent()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex gap-2 py-1 px-2 -mx-2 rounded-lg transition-colors",
        isSelected && "bg-white/5"
      )}
      onClick={onSelect}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Block controls */}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
        <button
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-colors cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddBelow();
          }}
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Block content */}
      <div className="flex-1 min-w-0">{renderBlockContent()}</div>

      {/* Block menu */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card border-white/10">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveUp}>
              <ChevronUp className="h-4 w-4 mr-2" /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveDown}>
              <ChevronDown className="h-4 w-4 mr-2" /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-400">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/watch\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Main editor component
export function NotionBlockEditor({
  blocks,
  onChange,
  readOnly = false,
}: NotionBlockEditorProps) {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashSearchQuery, setSlashSearchQuery] = useState("");
  const [slashMenuSelectedIndex, setSlashMenuSelectedIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const createBlock = (type: BlockType): NotionBlock => ({
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content: "",
    items: type === "bulletList" || type === "numberedList" ? [""] : undefined,
    calloutType: type === "callout" ? "info" : undefined,
  });

  const addBlock = (type: BlockType, afterIndex?: number) => {
    const newBlock = createBlock(type);
    const newBlocks = [...blocks];
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : blocks.length;
    newBlocks.splice(insertIndex, 0, newBlock);
    onChange(newBlocks);
    setSelectedBlockIndex(insertIndex);
    setSlashMenuOpen(false);
    setSlashSearchQuery("");
  };

  const updateBlock = (index: number, updates: Partial<NotionBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    onChange(newBlocks);
  };

  const deleteBlock = (index: number) => {
    if (blocks.length <= 1) {
      // Keep at least one block
      onChange([createBlock("paragraph")]);
      return;
    }
    const newBlocks = blocks.filter((_, i) => i !== index);
    onChange(newBlocks);
    setSelectedBlockIndex(Math.max(0, index - 1));
  };

  const duplicateBlock = (index: number) => {
    const newBlocks = [...blocks];
    const duplicated = {
      ...blocks[index],
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    newBlocks.splice(index + 1, 0, duplicated);
    onChange(newBlocks);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    onChange(newBlocks);
    setSelectedBlockIndex(toIndex);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, index: number) => {
    const block = blocks[index];

    // Handle slash command
    if (e.key === "/" && block.content === "") {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setSlashMenuPosition({ top: rect.bottom + 8, left: rect.left });
      setSlashMenuOpen(true);
      setSlashSearchQuery("");
      setSlashMenuSelectedIndex(0);
      return;
    }

    // Handle Enter to create new block
    if (e.key === "Enter" && !e.shiftKey) {
      if (block.type === "paragraph" || block.type.startsWith("heading")) {
        e.preventDefault();
        addBlock("paragraph", index);
      }
    }

    // Handle Backspace on empty block
    if (e.key === "Backspace" && block.content === "" && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(index);
    }

    // Handle markdown shortcuts
    if (e.key === " " && block.type === "paragraph") {
      const content = block.content;
      if (content === "#") {
        e.preventDefault();
        updateBlock(index, { type: "heading1", content: "" });
      } else if (content === "##") {
        e.preventDefault();
        updateBlock(index, { type: "heading2", content: "" });
      } else if (content === "###") {
        e.preventDefault();
        updateBlock(index, { type: "heading3", content: "" });
      } else if (content === "####") {
        e.preventDefault();
        updateBlock(index, { type: "heading4", content: "" });
      } else if (content === "-" || content === "*") {
        e.preventDefault();
        updateBlock(index, { type: "bulletList", content: "", items: [""] });
      } else if (content === "1.") {
        e.preventDefault();
        updateBlock(index, { type: "numberedList", content: "", items: [""] });
      } else if (content === ">") {
        e.preventDefault();
        updateBlock(index, { type: "quote", content: "" });
      } else if (content === "---") {
        e.preventDefault();
        updateBlock(index, { type: "divider", content: "" });
      }
    }
  };

  const handleSlashMenuKeyDown = (e: KeyboardEvent) => {
    if (!slashMenuOpen) return;

    const filteredTypes = BLOCK_TYPES.filter(
      (bt) =>
        bt.label.toLowerCase().includes(slashSearchQuery.toLowerCase()) ||
        bt.description.toLowerCase().includes(slashSearchQuery.toLowerCase())
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlashMenuSelectedIndex((prev) =>
        prev < filteredTypes.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlashMenuSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredTypes.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredTypes[slashMenuSelectedIndex]) {
        addBlock(filteredTypes[slashMenuSelectedIndex].type, selectedBlockIndex ?? undefined);
      }
    } else if (e.key === "Escape") {
      setSlashMenuOpen(false);
    }
  };

  // Initialize with empty paragraph if no blocks
  useEffect(() => {
    if (blocks.length === 0) {
      onChange([createBlock("paragraph")]);
    }
  }, []);

  if (readOnly) {
    return (
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            index={index}
            isSelected={false}
            onSelect={() => {}}
            onUpdate={() => {}}
            onDelete={() => {}}
            onDuplicate={() => {}}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onAddBelow={() => {}}
            onDragStart={() => {}}
            onDragOver={() => {}}
            onDragEnd={() => {}}
            onKeyDown={() => {}}
            readOnly
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className="min-h-[200px] p-4"
      onKeyDown={handleSlashMenuKeyDown}
    >
      {blocks.map((block, index) => (
        <BlockItem
          key={block.id}
          block={block}
          index={index}
          isSelected={selectedBlockIndex === index}
          onSelect={() => setSelectedBlockIndex(index)}
          onUpdate={(updates) => updateBlock(index, updates)}
          onDelete={() => deleteBlock(index)}
          onDuplicate={() => duplicateBlock(index)}
          onMoveUp={() => moveBlock(index, index - 1)}
          onMoveDown={() => moveBlock(index, index + 1)}
          onAddBelow={() => addBlock("paragraph", index)}
          onDragStart={() => setDraggedIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedIndex !== null && draggedIndex !== index) {
              moveBlock(draggedIndex, index);
              setDraggedIndex(index);
            }
          }}
          onDragEnd={() => setDraggedIndex(null)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}

      {/* Add block button */}
      <button
        onClick={() => addBlock("paragraph")}
        className="w-full py-3 mt-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-2 border border-dashed border-white/10"
      >
        <Plus className="h-4 w-4" /> Add a block
      </button>

      {/* Slash command menu */}
      <SlashMenu
        isOpen={slashMenuOpen}
        position={slashMenuPosition}
        searchQuery={slashSearchQuery}
        onSelect={(type) => addBlock(type, selectedBlockIndex ?? undefined)}
        onClose={() => setSlashMenuOpen(false)}
        selectedIndex={slashMenuSelectedIndex}
      />
    </div>
  );
}

export default NotionBlockEditor;
