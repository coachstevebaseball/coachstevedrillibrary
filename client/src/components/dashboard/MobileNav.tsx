import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar, type SidebarAction } from "./Sidebar";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (action: SidebarAction) => void;
};

export function MobileNav({ open, onOpenChange, onAction }: MobileNavProps) {
  const handleAction = (action: SidebarAction) => {
    onOpenChange(false);
    onAction?.(action);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="p-0 bg-[rgb(10,10,10)] border-r border-white/10 w-64 sm:max-w-xs"
      >
        <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
        <Sidebar onAction={handleAction} onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
