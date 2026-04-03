"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/components/app/StatCard";
import { PipelineBoard } from "@/components/app/PipelineBoard";
import { EmptyState } from "@/components/app/EmptyState";
import { Search, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

const MOCK_STATS = [
  { label: "Total Contacts", value: 12, trend: { value: "3", isPositive: true } },
  { label: "Emails Sent", value: 8, trend: { value: "2", isPositive: true } },
  { label: "Replies Received", value: 3, trend: { value: "1", isPositive: true }, color: "success" as const },
  { label: "Reply Rate", value: "25%", color: "success" as const },
];

const MOCK_CONTACTS = [
  { id: "1", name: "Sarah Chen", company: "Canva", confidence: "high" as const, lastActionAt: "2h ago", stage: "identified" as const },
  { id: "2", name: "Marcus Thorne", company: "Canva", confidence: "medium" as const, lastActionAt: "5h ago", stage: "identified" as const },
  { id: "3", name: "Elena Rodriguez", company: "Canva", confidence: "high" as const, lastActionAt: "1d ago", stage: "contacted" as const },
  { id: "4", name: "David Kim", company: "Atlassian", confidence: "high" as const, lastActionAt: "2d ago", stage: "responded" as const },
  { id: "5", name: "Lisa Wang", company: "SafetyCulture", confidence: "medium" as const, lastActionAt: "3d ago", stage: "chatted" as const },
];

const MOCK_HISTORY = [
  { id: "h1", company: "Canva", role: "Junior SWE", count: 3, date: "2h ago" },
  { id: "h2", company: "Atlassian", role: "Frontend Engineer", count: 5, date: "2d ago" },
  { id: "h3", company: "SafetyCulture", role: "Grad Engineer", count: 2, date: "3d ago" },
];

export default function DashboardPage() {
  const [contacts, setContacts] = useState<any[]>(MOCK_CONTACTS);
  const [isLoading, setIsLoading] = useState(false);

  if (contacts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-12">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Main Board */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-serif font-semibold text-text-primary">Pipeline Board</h2>
            <Link href="/search" className="text-sm font-semibold text-accent hover:underline">
              New Search →
            </Link>
          </div>
          <PipelineBoard 
            contacts={contacts} 
            onContactClick={(id) => console.log("Contact clicked:", id)} 
          />
        </div>

        {/* Sidebar History */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Clock className="w-4 h-4 text-text-muted" />
            <h2 className="text-sm font-mono font-bold text-text-muted uppercase tracking-widest">Recent Searches</h2>
          </div>
          
          <div className="bg-surface border border-border-card rounded-xl overflow-hidden divide-y divide-border-card">
            {MOCK_HISTORY.map((item) => (
              <Link 
                key={item.id} 
                href={`/search/${item.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-alt transition-colors group"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-text-primary">{item.company}</p>
                  <p className="text-xs text-text-muted">{item.role} · {item.count} hits</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent transition-colors" />
              </Link>
            ))}
          </div>
          
          <div className="p-4 bg-accent-bg border border-accent/10 rounded-xl">
            <p className="text-xs text-accent font-medium leading-relaxed italic">
              Pro tip: Revisit past searches to find fresh activity hooks for follow-ups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
