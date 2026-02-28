import { Shield } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full size-16">
      <Shield className="w-8 h-8" />
    </div>
  );
}

export function SidebarLogo() {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg p-2">
                <Shield className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
                LineCommand
            </span>
        </div>
    )
}
