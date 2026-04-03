"use client";

import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { CreditsBadge } from "./CreditsBadge";

const ROUTE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/search": "New Search",
  "/drafts": "Email Drafts",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  
  // Find the matching route name
  const pageTitle = ROUTE_NAMES[pathname] || 
                    (pathname.startsWith("/search/") ? "Search Results" : 
                     pathname.startsWith("/drafts/") ? "Edit Draft" : "App");

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8 sticky top-0 z-30">
      <h1 className="text-xl font-serif font-semibold text-text-primary tracking-tight">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-6">
        <CreditsBadge />
        <UserMenu />
      </div>
    </header>
  );
}
