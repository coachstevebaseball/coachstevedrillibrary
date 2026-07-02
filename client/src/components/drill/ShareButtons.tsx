/**
 * ShareButtons — social sharing row for individual drill detail pages.
 *
 * Renders Twitter/X, Facebook, LinkedIn, and a copy-link button.
 * The share URL always points at the canonical embed page so the
 * Open Graph tags (set by EmbedDrillDetail / seoPrerender) are picked up.
 */

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "https://coachsteve.manus.space";

// ── SVG icons (inline, no extra dependency) ──────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ShareButtonsProps {
  /** Drill slug — used to build the canonical share URL */
  drillId: string;
  /** Drill name — used in the pre-filled share text */
  drillName: string;
  /** Optional extra CSS classes on the wrapper */
  className?: string;
}

export function ShareButtons({ drillId, drillName, className = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // Always share the canonical embed URL so OG tags are resolved correctly
  const shareUrl = `${BASE_URL}/embed/drill/${drillId}`;
  const shareText = `Check out this baseball drill: ${drillName}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link. Please copy it manually.");
    }
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
        Share
      </span>

      {/* Twitter / X */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 transition-colors"
      >
        <XIcon className="w-3.5 h-3.5" />
      </a>

      {/* Facebook */}
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-[#1877F2]/20 text-muted-foreground hover:text-[#1877F2] border border-white/10 hover:border-[#1877F2]/30 transition-colors"
      >
        <FacebookIcon className="w-3.5 h-3.5" />
      </a>

      {/* LinkedIn */}
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-[#0A66C2]/20 text-muted-foreground hover:text-[#0A66C2] border border-white/10 hover:border-[#0A66C2]/30 transition-colors"
      >
        <LinkedInIcon className="w-3.5 h-3.5" />
      </a>

      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 transition-colors"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Link2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
