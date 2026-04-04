"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Share2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { ContactCard } from "@/components/app/ContactCard";
import { SkeletonCard } from "@/components/app/SkeletonCard";
import { SlideOver } from "@/components/app/SlideOver";
import { ScoreBreakdown } from "@/components/app/ScoreBreakdown";
import { ResearchCard } from "@/components/app/ResearchCard";
import { EmailDraft } from "@/components/app/EmailDraft";
import { FollowUpReminder } from "@/components/app/FollowUpReminder";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import type { PipelineResponse } from "@/shared/types/agents";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch results");
    return res.json();
  });

export default function SearchResultsPage() {
  const { id } = useParams();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: PipelineResponse;
  }>(id ? `/api/search/${id}` : null, fetcher, {
    refreshInterval: (data) =>
      data?.data.pipeline_status === "running" ? 3000 : 0,
  });

  const { data: profileData } = useSWR<{ plan: string }>(
    "/api/dashboard/stats",
    fetcher,
  );
  const isPro = profileData?.plan === "pro";

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2 h-4 w-32 bg-border/10 rounded animate-pulse" />
        <div className="h-10 w-64 bg-border/10 rounded animate-pulse" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || (data && !data.success)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 bg-error-bg rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-error" />
        </div>
        <h2 className="text-xl font-serif font-semibold text-text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-text-body mb-8 max-w-sm">
          We couldn&apos;t load these results. Try refreshing the page or check
          the search ID.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  const results = data?.data;
  if (!results) return null;

  const selectedContactData =
    results.contacts.find((c) => c.id === selectedContactId) ||
    results.contacts.find((c, idx) => `c-${idx}` === selectedContactId);
  const selectedDraft = selectedContactData
    ? results.drafts.find((d) => d.contact_name === selectedContactData.name)
    : null;

  const handleStageMoved = async (contactId: string, stage: string) => {
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      mutate();
    } catch {
      // Optimistic — silently fail, SWR revalidate will correct
    }
  };

  const handleMarkAsSent = async (contactId: string) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "contacted" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Marked as sent");
      mutate();
    } catch {
      toast.error("Couldn't update status. Please try again.");
    }
  };

  const handleRegenerate = async (draftId: string) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}/regenerate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Draft regenerated");
      mutate();
    } catch {
      toast.error("Couldn't regenerate draft. Please try again.");
    }
  };

  const handleUpdateDraft = (
    _draftId: string,
    _subject: string,
    _body: string,
  ) => {
    // EmailDraft auto-save handles the PATCH call internally
    // This callback refreshes the SWR cache after save
    mutate();
  };

  return (
    <div className="space-y-10 pb-20">
      {/* SlideOver for Detail View */}
      <SlideOver
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
        title="Contact Details"
      >
        {selectedContactData && (
          <div className="space-y-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif font-semibold text-text-primary">
                {selectedContactData.name}
              </h3>
              <p className="text-text-body font-medium">
                {selectedContactData.title}{" "}
                <span className="text-text-muted mx-1 font-sans font-light">
                  ·
                </span>{" "}
                {results.company}
              </p>
            </div>

            <FollowUpReminder contactId={selectedContactId ?? ""} />

            <ScoreBreakdown
              score={
                selectedContactData.score ??
                Math.round(selectedContactData.confidence * 100)
              }
              breakdown={selectedContactData.scoreBreakdown ?? null}
            />

            <ResearchCard
              background={selectedContactData.researchBackground ?? null}
              askThis={selectedContactData.researchAskThis ?? null}
              mentionThis={
                selectedContactData.researchMentionThis ??
                (selectedContactData.hooks[0] || null)
              }
            />

            {selectedDraft && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
                    {"// Generated_Outreach \\"}
                  </span>
                  <div className="h-px flex-1 bg-border-card" />
                </div>
                <div className="bg-surface border border-border-card rounded-2xl overflow-hidden shadow-sm">
                  <EmailDraft
                    draft={{
                      id: selectedDraft.id,
                      subject: selectedDraft.subject,
                      body: selectedDraft.body,
                      hook_used: selectedDraft.hook_used,
                    }}
                    email={selectedContactData.email}
                    contactId={selectedContactData.id}
                    company={results.company}
                    isPro={isPro}
                    onClose={() => setSelectedContactId(null)}
                    onRegenerate={() => handleRegenerate(selectedDraft.id)}
                    onSave={() => mutate()}
                    onStageMoved={handleStageMoved}
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </SlideOver>

      {/* Header Area */}
      <div className="flex flex-col gap-6">
        <nav className="flex items-center gap-2 text-xs font-mono font-bold text-text-muted uppercase tracking-widest">
          <Link href="/" className="hover:text-accent transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-text-primary">{results.company}</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-text-primary">
                {results.company}{" "}
                <span className="text-text-muted mx-2 font-sans font-light">
                  ·
                </span>{" "}
                <span className="italic-accent">{results.role}</span>
              </h1>
              {results.pipeline_status === "running" && (
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-body font-sans font-medium">
              <span className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${results.contacts.length > 0 ? "bg-success" : "bg-text-light"}`}
                />
                {results.contacts.length} contacts found
              </span>
              <span className="text-text-muted uppercase text-[11px] font-mono font-bold tracking-wider">
                STATUS: {results.pipeline_status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-6">
        {results.contacts.map((contact, idx) => {
          const draft = results.drafts.find(
            (d) => d.contact_name === contact.name,
          );

          const contactId = contact.id || `c-${idx}`;
          const mappedContact = {
            id: contactId,
            name: contact.name,
            title: contact.title,
            company: results.company,
            email: contact.email,
            confidence: (contact.confidence > 0.8
              ? "high"
              : contact.confidence > 0.5
                ? "medium"
                : "low") as "high" | "medium" | "low",
            hooks: contact.hooks.map((h) => ({
              text: h,
              source: "#",
              type: "news",
            })),
            draft: draft
              ? {
                  id: draft.id || `d-${idx}`,
                  subject: draft.subject,
                  body: draft.body,
                  hook_used: draft.hook_used,
                }
              : undefined,
            score: contact.score,
            scoreBreakdown: contact.scoreBreakdown ?? null,
            researchBackground: contact.researchBackground ?? null,
            researchAskThis: contact.researchAskThis ?? null,
            researchMentionThis: contact.researchMentionThis ?? null,
            stage: "identified",
          };

          return (
            <ContactCard
              key={idx}
              contact={mappedContact}
              isPro={isPro}
              onUpdateDraft={handleUpdateDraft}
              onViewDetails={() => setSelectedContactId(contactId)}
              onRegenerateDraft={(draftId) => handleRegenerate(draftId)}
              onMarkAsSent={handleMarkAsSent}
              onStageMoved={handleStageMoved}
            />
          );
        })}

        {results.contacts.length === 0 &&
          results.pipeline_status === "complete" && (
            <div className="bg-surface border border-dashed border-border-card rounded-2xl p-12 text-center">
              <p className="text-text-body">
                No high-resonance contacts identified for this search.
              </p>
              <Link href="/search" className="inline-block mt-4">
                <Button variant="outline">Try Refined Search</Button>
              </Link>
            </div>
          )}
      </div>

      {/* Footer CTA */}
      <div className="pt-10 border-t border-border-card text-center">
        <p className="text-text-muted text-sm mb-6">
          Not finding what you need? Refine your search parameters.
        </p>
        <Link href="/search">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to New Search
          </Button>
        </Link>
      </div>
    </div>
  );
}
