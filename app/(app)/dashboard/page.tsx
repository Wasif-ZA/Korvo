"use client";

import { useState } from "react";
import useSWR from "swr";
import { StatCard } from "@/components/app/StatCard";
import { PipelineBoard } from "@/components/app/PipelineBoard";
import { EmptyState } from "@/components/app/EmptyState";
import { SlideOver } from "@/components/app/SlideOver";
import { ScoreBreakdown } from "@/components/app/ScoreBreakdown";
import { ResearchCard } from "@/components/app/ResearchCard";
import { EmailDraft } from "@/components/app/EmailDraft";
import { FollowUpReminder } from "@/components/app/FollowUpReminder";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import type { ScoringSignals } from "@/shared/types/agents";

interface ContactData {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  confidence: "high" | "medium" | "low";
  score: number;
  scoreBreakdown: ScoringSignals | null;
  researchBackground: string | null;
  researchAskThis: string | null;
  researchMentionThis: string | null;
  stage: string;
  lastActionAt: string;
  draft: {
    id: string;
    subject: string;
    body: string;
    hook_used: string;
  } | null;
}

interface StatData {
  label: string;
  value: string | number;
}

interface HistoryItem {
  id: string;
  company: string;
  role: string;
  contactsCount?: number;
}

interface ApiResponse<T> {
  data: T;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

const formatStage = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const DEFAULT_STATS: StatData[] = [
  { label: "Total Contacts", value: 0 },
  { label: "Emails Sent", value: 0 },
  { label: "Replies Received", value: 0 },
  { label: "Reply Rate", value: "0%" },
];

export default function DashboardPage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );

  const { data: statsData, isLoading: statsLoading } = useSWR<
    ApiResponse<StatData[]> & { plan?: string }
  >("/api/dashboard/stats", fetcher);

  const {
    data: contactsData,
    isLoading: contactsLoading,
    mutate: mutateContacts,
  } = useSWR<ApiResponse<ContactData[]>>("/api/contacts", fetcher);

  const { data: historyData } = useSWR<ApiResponse<HistoryItem[]>>(
    "/api/search",
    fetcher,
  );

  const handleContactMove = async (id: string, newStage: string) => {
    // Optimistic update: apply immediately without revalidating
    await mutateContacts(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((c) =>
            c.id === id ? { ...c, stage: newStage } : c,
          ),
        };
      },
      { revalidate: false },
    );

    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Moved to ${formatStage(newStage)}`);
      await mutateContacts();
    } catch {
      await mutateContacts(); // revert optimistic update
      toast.error("Couldn't update stage. Please try again.");
    }
  };

  const isPro = statsData?.plan === "pro";

  const handleStageMovedForContact = (contactId: string, stage: string) => {
    handleContactMove(contactId, stage);
  };

  const handleRegenerate = async (draftId: string) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      await mutateContacts();
      toast.success("Draft regenerated");
    } catch {
      toast.error("Couldn't regenerate draft. Please try again.");
    }
  };

  const isLoading = statsLoading || contactsLoading;
  const contacts = contactsData?.data ?? [];
  const stats = statsData?.data ?? DEFAULT_STATS;
  const history = historyData?.data ?? [];

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm font-mono text-text-muted uppercase tracking-widest">
            Loading_Pipeline_Data...
          </p>
        </div>
      </div>
    );
  }

  if (contacts.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* SlideOver for Contact Details */}
      <SlideOver
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
        title="Contact Details"
      >
        {selectedContact && (
          <div className="space-y-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif font-semibold text-text-primary">
                {selectedContact.name}
              </h3>
              <p className="text-text-body font-medium">
                {selectedContact.title}{" "}
                <span className="text-text-muted mx-1 font-sans font-light">
                  {"·"}
                </span>{" "}
                {selectedContact.company}
              </p>
            </div>

            <FollowUpReminder contactId={selectedContact.id} />

            <ScoreBreakdown
              score={selectedContact.score ?? 0}
              breakdown={selectedContact.scoreBreakdown}
            />

            <ResearchCard
              background={selectedContact.researchBackground}
              askThis={selectedContact.researchAskThis}
              mentionThis={selectedContact.researchMentionThis}
            />

            {selectedContact.draft && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
                    {"// Generated_Outreach \\\\"}
                  </span>
                  <div className="h-px flex-1 bg-border-card" />
                </div>
                <div className="bg-surface border border-border-card rounded-2xl overflow-hidden shadow-sm">
                  <EmailDraft
                    draft={selectedContact.draft}
                    email={selectedContact.email}
                    contactId={selectedContact.id}
                    isPro={isPro}
                    onClose={() => setSelectedContactId(null)}
                    onRegenerate={() =>
                      handleRegenerate(selectedContact.draft!.id)
                    }
                    onSave={() => mutateContacts()}
                    onStageMoved={handleStageMovedForContact}
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </SlideOver>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Main Board */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-serif font-semibold text-text-primary uppercase tracking-tight">
              Pipeline <span className="italic-accent">Board</span>
            </h2>
            <Link
              href="/search"
              className="text-sm font-bold text-accent hover:underline uppercase tracking-widest flex items-center gap-2"
            >
              New Search
              <span className="text-lg">{"→"}</span>
            </Link>
          </div>
          <PipelineBoard
            contacts={
              contacts as Parameters<typeof PipelineBoard>[0]["contacts"]
            }
            onContactMove={handleContactMove}
            onContactClick={(id) => setSelectedContactId(id)}
          />
        </div>

        {/* Sidebar History */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 border-l-2 border-accent/20 pl-4">
            <h2 className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-[0.2em]">
              {"// Recent_Searches \\\\"}
            </h2>
          </div>

          <div className="bg-surface border border-border-card rounded-xl overflow-hidden divide-y divide-border-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {history.length > 0 ? (
              history.map((item) => (
                <Link
                  key={item.id}
                  href={`/search/${item.id}`}
                  className="flex items-center justify-between p-4 hover:bg-surface-alt transition-all group"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {item.company}
                    </p>
                    <p className="text-[10px] font-mono text-text-muted uppercase font-bold">
                      {item.role} · {item.contactsCount ?? 0} hits
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent transition-all transform group-hover:translate-x-0.5" />
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs text-text-muted italic font-mono uppercase tracking-widest">
                  No_History_Found
                </p>
              </div>
            )}
          </div>

          <div className="p-5 bg-accent-bg border border-accent/10 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Search className="w-12 h-12 text-accent" />
            </div>
            <p className="text-xs text-accent font-bold leading-relaxed italic relative z-10 font-sans">
              Pro tip: Revisit past searches to find fresh activity hooks for
              follow-ups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
