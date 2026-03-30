import { Link } from "wouter";
import { BookOpen, BarChart3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * /embed — Streamlined landing page for iframe embedding.
 * No site header/footer/nav chrome. Minimal branding.
 * All links stay within /embed/* namespace.
 */
export default function EmbedHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-6 flex flex-col">
      {/* Compact Header */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-1.5 mb-4">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-red-400 tracking-wider uppercase">
            Coach Steve's Drill Library
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Player Development Platform
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Professional training drills designed to build elite mechanics, explosive power, and game-ready confidence.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full flex-1">
        <Link href="/embed/drills" className="group block">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-full transition-all duration-300 hover:bg-slate-800/80 hover:border-red-600/30 hover:shadow-lg hover:shadow-red-900/10 hover:-translate-y-0.5">
            <div className="bg-red-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-600/20 transition-colors">
              <BookOpen className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2 group-hover:text-red-400 transition-colors">
              Browse Drills
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Explore the full library of 200+ professional baseball drills with video, instructions, and equipment details.
            </p>
          </div>
        </Link>

        <Link href="/embed/drills" className="group block">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-full transition-all duration-300 hover:bg-slate-800/80 hover:border-blue-600/30 hover:shadow-lg hover:shadow-blue-900/10 hover:-translate-y-0.5">
            <div className="bg-blue-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors">
              Search & Filter
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Find drills by category, difficulty level, equipment, and more. Build the perfect practice plan.
            </p>
          </div>
        </Link>
      </div>

      {/* Minimal Footer */}
      <div className="text-center mt-8 pb-2">
        <p className="text-xs text-slate-600">
          Powered by{" "}
          <a
            href="https://coachstevemobilecoach.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-red-400 transition-colors"
          >
            Coach Steve's Hitters Lab
          </a>
        </p>
      </div>
    </div>
  );
}
