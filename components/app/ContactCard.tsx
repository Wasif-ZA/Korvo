"use client";

import { useState } from "react";
import { Copy, MoreVertical, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EmailDraft } from "./EmailDraft";
import { cn } from "@/lib/utils/cn";
import { toast } from "react-hot-toast";

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
}

interface ContactCardProps {
  contact: Contact;
  onUpdateDraft?: (id: string, subject: string, body: string) => void;
  onRegenerateDraft?: (id: string) => void;
}

export function ContactCard({ contact, onUpdateDraft, onRegenerateDraft }: ContactCardProps) {
  const [isDraftOpen, setIsDraftOpen] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contact.email);
    toast.success("Email copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <Card className="bg-surface border-border-card p-0 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-text-primary">{contact.name}</h3>
              <p className="text-sm text-text-body">
                {contact.title} <span className="text-text-muted mx-1">·</span> {contact.company}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-mono text-text-primary">{contact.email}</span>
                <ConfidenceBadge confidence={contact.confidence} />
              </div>
            </div>
          </div>

          {/* Hook section */}
          <div className="bg-surface-alt border border-border-card rounded-lg p-5 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🎯</span>
              <div className="space-y-2">
                <p className="text-[15px] text-text-body leading-relaxed italic">
                  &quot;{contact.hooks[0]?.text}&quot;
                </p>
                <a 
                  href={contact.hooks[0]?.source} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-mono font-bold text-accent hover:underline uppercase tracking-widest"
                >
                  Source: {contact.hooks[0]?.source.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-accent hover:bg-accent-bg -ml-2"
                onClick={() => setIsDraftOpen(!isDraftOpen)}
              >
                {isDraftOpen ? "Close Email Draft" : "View Email Draft →"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="hidden sm:flex"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Email
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="text-text-muted">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Inline Draft Expansion */}
        {isDraftOpen && contact.draft && (
          <div className="border-t border-border-card bg-surface">
            <EmailDraft 
              draft={contact.draft} 
              email={contact.email}
              onClose={() => setIsDraftOpen(false)}
              onSave={(s, b) => onUpdateDraft?.(contact.draft!.id, s, b)}
              onRegenerate={() => onRegenerateDraft?.(contact.draft!.id)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
