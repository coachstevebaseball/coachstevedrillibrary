import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; tabName?: string; }
interface State { hasError: boolean; error?: Error; }

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error(`[TabErrorBoundary] Crash in tab "${this.props.tabName}":`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Something went wrong in this tab</p>
            <p className="text-white/40 text-sm mt-1 max-w-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-white/20 text-white/60 hover:text-white"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
