import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ContentBlock {
  id: string;
  type: "text" | "video" | "image" | "list" | "callout" | "divider";
  content?: string;
  url?: string;
  items?: string[];
  style?: {
    fontSize?: string;
    fontWeight?: string;
    textAlign?: string;
    color?: string;
  };
}

interface CustomDrillLayoutProps {
  blocks: ContentBlock[];
}

export function CustomDrillLayout({ blocks }: CustomDrillLayoutProps) {
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "text":
        return (
          <p
            key={block.id}
            style={{
              fontSize: block.style?.fontSize,
              fontWeight: block.style?.fontWeight,
              textAlign: block.style?.textAlign as any,
              color: block.style?.color,
            }}
          >
            {block.content}
          </p>
        );
      case "video":
        if (!block.url) return null;
        const videoId = block.url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/watch\/|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
        return videoId ? (
          <div key={block.id} className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null;
      case "image":
        return block.url ? (
          <img key={block.id} src={block.url} alt="Content" className="max-w-full h-auto rounded" />
        ) : null;
      case "list":
        return (
          <ul key={block.id} className="list-disc list-inside space-y-1">
            {block.items?.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
      case "callout":
        return (
          <div key={block.id} className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p>{block.content}</p>
            </div>
          </div>
        );
      case "divider":
        return <hr key={block.id} className="my-4 border-t border-border" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        {blocks.map((block) => renderBlock(block))}
      </CardContent>
    </Card>
  );
}
