"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function ChatLayout({ children, sidebar }: ChatLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      {sidebar && (
        <aside className="hidden md:flex w-72 border-r border-border bg-surface shrink-0 overflow-y-auto">
          {sidebar}
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
