"use client";

import { useEffect, useState } from "react";
import {
  History,
  LayoutDashboard,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface SidebarProps {
  user: { email?: string };
  activeView: "chat" | "pipeline" | "settings" | "pricing";
  onViewChange: (view: "chat" | "pipeline" | "settings" | "pricing") => void;
  onHistorySelect: (searchId: string) => void;
}

export function Sidebar({
  user,
  activeView,
  onViewChange,
  onHistorySelect,
}: SidebarProps) {
  const [history, setHistory] = useState<
    { id: string; company: string; role: string }[]
  >([]);
  const [usage, setUsage] = useState({ used: 0, limit: 5 });
  const [stats, setStats] = useState<
    { label: string; value: string | number; color?: string }[]
  >([]);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Fetch history
    fetch("/api/search")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHistory(data.data);
      });

    // Fetch usage from /api/me (Plan 01 wraps response in { success, data: { searchesUsed, searchesLimit } })
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsage({
            used: data.data.searchesUsed,
            limit: data.data.searchesLimit,
          });
        }
      });

    // Fetch dashboard stats
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {}); // Silently fail if not authenticated
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full text-text-primary p-4">
      {/* User Info */}
      <div className="flex items-center gap-3 mb-8 px-2 py-3 bg-primary/40 rounded-xl border border-border/40">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[12px] font-bold">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold truncate">
            {user?.email?.split("@")[0]}
          </p>
          <p className="text-[11px] text-text-secondary uppercase tracking-widest font-mono">
            Status: Stable
          </p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="space-y-1 mb-8">
        <button
          onClick={() => onViewChange("chat")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-medium",
            activeView === "chat"
              ? "bg-accent text-white"
              : "text-text-secondary hover:bg-elevated hover:text-text-primary",
          )}
        >
          <History className="w-4 h-4" />
          Search History
        </button>
        <button
          onClick={() => onViewChange("pipeline")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-medium",
            activeView === "pipeline"
              ? "bg-accent text-white"
              : "text-text-secondary hover:bg-elevated hover:text-text-primary",
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Outreach Pipeline
        </button>
      </nav>

      {/* Search History List */}
      <div className="flex-1 overflow-y-auto min-h-0 mb-6 px-1">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-4 px-2">
          Recent Searches
        </h4>
        <div className="space-y-2">
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                onViewChange("chat");
                onHistorySelect(h.id);
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-elevated transition-colors group"
            >
              <div className="text-[12px] font-medium text-text-primary truncate">
                {h.company}
              </div>
              <div className="text-[10px] text-text-secondary truncate">
                {h.role}
              </div>
            </button>
          ))}
          {history.length === 0 && (
            <p className="text-[11px] text-text-muted italic px-2">
              No history yet
            </p>
          )}
        </div>
      </div>

      {/* Usage Badge */}
      <div className="mb-6 px-2 py-4 bg-elevated/50 rounded-2xl border border-border/40">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            Usage
          </span>
          <span className="text-[10px] font-mono text-text-primary">
            {usage.used}/{usage.limit}
          </span>
        </div>
        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${(usage.used / usage.limit) * 100}%` }}
          />
        </div>
      </div>

      {/* Stats Summary */}
      {stats.length > 0 && (
        <div className="mb-6 px-2 py-3 bg-elevated/50 rounded-2xl border border-border/40">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3 px-1">
            Stats
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[14px] font-bold text-text-primary">
                  {s.value}
                </p>
                <p className="text-[9px] text-text-secondary uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Nav */}
      <div className="pt-4 border-t border-border space-y-1">
        <button
          onClick={() => onViewChange("settings")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] text-text-secondary hover:bg-elevated hover:text-text-primary transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={() => onViewChange("pricing")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] text-text-secondary hover:bg-elevated hover:text-text-primary transition-all"
        >
          <CreditCard className="w-4 h-4" />
          Upgrade
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] text-error hover:bg-error/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
