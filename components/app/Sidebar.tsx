"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, FileText, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Search", href: "/search", icon: Search },
  { label: "Drafts", href: "/drafts", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-surface sticky top-0 h-screen transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-6 mb-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-white shrink-0">
            K
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold font-serif italic-accent tracking-tight">
              Korvo
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm font-semibold transition-colors relative group",
                isActive
                  ? "bg-accent-bg text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-alt"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary")} />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-accent rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border">
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!isCollapsed && <span className="text-sm font-semibold">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
