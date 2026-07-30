import { Link, useLocation } from "wouter";
import { FolderOpen, Users, Clapperboard, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Projects", icon: FolderOpen },
  { href: "/characters", label: "Characters", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-16 md:w-64 border-r border-border bg-card/50 flex flex-col h-full flex-shrink-0">
      <div className="h-14 flex items-center justify-center md:justify-start md:px-4 border-b border-border/50">
        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-black" />
        </div>
        <span className="font-bold tracking-wide ml-3 hidden md:block text-primary">Flows</span>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-2 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer group",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="hidden md:block">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-center md:justify-start gap-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-2 md:px-0">
          <Settings className="h-5 w-5" />
          <span className="hidden md:block font-medium">Settings</span>
        </div>
      </div>
    </aside>
  );
}