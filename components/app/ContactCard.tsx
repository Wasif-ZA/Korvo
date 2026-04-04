"use client";

import { useState } from "react";
import { Copy, MoreVertical, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EmailDraft } from "./EmailDraft";
import { ResearchCard } from "./ResearchCard";
import { cn } from "@/lib/utils/cn";
import { toast } from "react-hot-toast";
import type { ScoringSignals } from "@/shared/types/agents";

interface Hook {
  text: string;
  source: string;
  type: string;
}

interface Draft {
  id: string;
  subject: string;
  body: string;
  hook_used: string;
}

interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  confidence: "high" | "medium" | "low";
  hooks: Hook[];
  draft?: Draft;
  score?: number;
  scoreBreakdown?: ScoringSignals | null;
  researchBackground?: string | null;
  researchAskThis?: string | null;
  researchMentionThis?: string | null;
  stage?: string;
}

interface ContactCardProps {
  contact: Contact;
  isPro?: boolean;
  onUpdateDraft?: (id: string, subject: string, body: string) => void;
  onRegenerateDraft?: (id: string) => void;
  onViewDetails?: () => void;
  onMarkAsSent?: (contactId: string) => void;
  onStageMoved?: (contactId: string, stage: string) => void;
}

function getScoreToneClasses(score: number): string {
  if (score >= 75) return "bg-success/10 text-success";
  if (score >= 45) return "bg-warning/10 text-warning";
  return "bg-error/10 text-error";
}

export function ContactCard({
  contact,
  isPro = false,
  onUpdateDraft,
  onRegenerateDraft,
  onViewDetails,
  onMarkAsSent,
  onStageMoved,
}: ContactCardProps) {
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [isResearchOpen, setIsResearchOpen] = useState(false);

  const handleCopyEmail = () => {
    if (!contact.email) {
      toast.error("No email available for this contact");
      return;
    }
    navigator.clipboard.writeText(contact.email);
    toast.success("Email copied to clipboard");
  };

  const hasScore = contact.score !== undefined && contact.score > 0;

  return (
    <div className="space-y-4">
      <Card className="bg-surface border-border-card p-0 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-text-primary">
                {contact.name}
              </h3>
              <p className="text-sm text-text-body font-medium">
                {contact.title}{" "}
                <span className="text-text-muted mx-1 font-sans font-light">
                  ·
                </span>{" "}
                {contact.company}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-mono text-text-primary font-medium tracking-tight">
                  {contact.email || "email@not_found.com"}
                </span>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge confidence={contact.confidence} />
                  {hasScore && (
                    <span
                      className={cn(
                        "text-xs font-mono font-bold px-2 py-0.5 rounded",
                        getScoreToneClasses(contact.score!),
                      )}
                    >
                      {contact.score}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hook section */}
          <div className="bg-surface-alt border border-border-card rounded-xl p-6 mb-8 relative group/hook">
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5 select-none">🎯</span>
              <div className="space-y-3">
                <p className="text-[15px] text-text-body leading-relaxed italic font-sans">
                  &quot;
                  {contact.hooks[0]?.text ||
                    "No activity hooks found for this contact."}
                  &quot;
                </p>
                {contact.hooks[0]?.source &&
                  contact.hooks[0].source !== "#" && (
                    <a
                      href={contact.hooks[0].source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-accent hover:underline uppercase tracking-[0.15em] transition-all"
                    >
                      Source:{" "}
                      {
                        contact.hooks[0].source
                          .replace(/^https?:\/\/(www\.)?/, "")
                          .split("/")[0]
                      }
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
              </div>
            </div>
          </div>

          {/* Research Card (collapsible) */}
          {isResearchOpen && (
            <div className="animate-in slide-in-from-top duration-300 mb-8">
              <ResearchCard
                background={contact.researchBackground ?? null}
                askThis={contact.researchAskThis ?? null}
                mentionThis={contact.researchMentionThis ?? null}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-accent hover:bg-accent-bg -ml-2 font-bold uppercase text-xs tracking-widest"
                onClick={() => setIsDraftOpen(!isDraftOpen)}
              >
                {isDraftOpen ? "Close Email Draft" : "View Email Draft →"}
              </Button>
              <Button
                variant="ghost"
                className="text-text-muted hover:text-text-primary font-bold uppercase text-xs tracking-widest"
                onClick={() => setIsResearchOpen(!isResearchOpen)}
              >
                {isResearchOpen ? "Close Research" : "View Research"}
              </Button>
              {onViewDetails && (
                <Button
                  variant="ghost"
                  className="text-text-muted hover:text-text-primary font-bold uppercase text-xs tracking-widest"
                  onClick={onViewDetails}
                >
                  Full Details
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="hidden sm:flex h-9 text-xs font-bold uppercase tracking-widest"
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy Email
              </Button>
              <Button
                variant="ghost"
                className="text-text-muted hover:text-success font-bold uppercase text-xs tracking-widest"
                onClick={() => onMarkAsSent?.(contact.id)}
                disabled={contact.stage === "contacted"}
              >
                {contact.stage === "contacted" ? "Sent" : "Mark as Sent"}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-text-muted h-9 w-9"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Inline Draft Expansion */}
        {isDraftOpen && contact.draft && (
          <div className="border-t border-border-card bg-surface shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <EmailDraft
              draft={contact.draft}
              email={contact.email}
              contactId={contact.id}
              company={contact.company}
              isPro={isPro}
              onClose={() => setIsDraftOpen(false)}
              onSave={(s, b) => onUpdateDraft?.(contact.draft!.id, s, b)}
              onRegenerate={() => onRegenerateDraft?.(contact.draft!.id)}
              onStageMoved={onStageMoved}
            />
          </div>
        )}

        {isDraftOpen && !contact.draft && (
          <div className="p-8 border-t border-border-card bg-surface text-center">
            <p className="text-sm text-text-muted italic font-mono">
              [ DRAFT_BUFFER_EMPTY ]
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
