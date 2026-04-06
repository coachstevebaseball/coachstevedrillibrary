import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Send,
  Loader2,
  Home,
  RotateCcw,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "model";
  content: string;
}

const QUICK_PROMPTS = [
  "I keep rolling over to the pull side",
  "I'm popping up everything",
  "I'm always late on fastballs",
  "I strike out looking too much",
  "My exit velocity is dropping",
  "I can't hit breaking balls",
  "I'm lunging at pitches",
  "I have no power to the opposite field",
];

export default function HittingCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const askMutation = trpc.hittingCoach.ask.useMutation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const result = await askMutation.mutateAsync({
        message: trimmed,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      setMessages([
        ...newMessages,
        { role: "model", content: result.response },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "model",
          content:
            "⚠️ Coach Steve is unavailable right now. Check your connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-[#0f1419] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0A1628]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/athlete-portal">
              <button className="text-white/50 hover:text-white transition-colors">
                <Home className="h-4 w-4" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#e4002b] flex items-center justify-center text-white text-xs font-bold">
                CS
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">
                  AI Hitting Coach
                </p>
                <p className="text-white/40 text-xs">Coach Steve Baseball</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-[#e4002b]/40 text-[#e4002b] text-xs hidden sm:flex"
            >
              <Zap className="h-3 w-3 mr-1" />
              Process Over Outcome
            </Badge>
            {!isEmpty && (
              <button
                onClick={reset}
                className="text-white/40 hover:text-white transition-colors flex items-center gap-1 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                New
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isEmpty ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-8">
              <div>
                <div className="w-16 h-16 rounded-full bg-[#e4002b] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-[#e4002b]/30">
                  CS
                </div>
                <h1 className="text-white text-2xl font-bold mb-2">
                  What's going wrong at the plate?
                </h1>
                <p className="text-white/50 text-sm max-w-md">
                  Describe your hitting issue and get a Coach Steve breakdown —
                  drills, cues, and a mental approach tip. Real coaching, no
                  fluff.
                </p>
              </div>

              {/* Quick prompts */}
              <div className="w-full max-w-2xl">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-3">
                  Common issues
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="flex items-center justify-between text-left px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                        {prompt}
                      </span>
                      <ChevronRight className="h-3 w-3 text-white/30 group-hover:text-[#e4002b] transition-colors flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-6 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "model" && (
                    <div className="w-8 h-8 rounded-full bg-[#e4002b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 shadow-md shadow-[#e4002b]/20">
                      CS
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[#e4002b] text-white rounded-tr-sm"
                        : "bg-white/8 border border-white/10 text-white/90 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="text-sm leading-relaxed text-white/85 [&_h2]:text-[#e4002b] [&_h2]:font-bold [&_h2]:text-sm [&_h2]:mt-4 [&_h2]:mb-1 [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-1 [&_h3]:text-white [&_h3]:font-semibold [&_h3]:text-sm [&_h3]:mt-3 [&_strong]:text-white [&_li]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_p]:my-1 max-w-none">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xs flex-shrink-0 mt-1">
                      Y
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#e4002b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 shadow-md shadow-[#e4002b]/20">
                    CS
                  </div>
                  <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-[#e4002b]" />
                      Breaking down your swing...
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 bg-[#0A1628]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your hitting issue... (e.g. I keep rolling over to the pull side)"
                className="bg-white/8 border-white/15 text-white placeholder:text-white/30 resize-none min-h-[48px] max-h-32 rounded-xl focus:border-[#e4002b]/50 focus:ring-[#e4002b]/20 pr-4"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-[#e4002b] hover:bg-[#c0001f] text-white h-12 w-12 p-0 rounded-xl flex-shrink-0 shadow-lg shadow-[#e4002b]/20 disabled:opacity-40 disabled:shadow-none transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-white/20 text-xs text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
