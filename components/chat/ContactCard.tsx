"use client";

import { useState } from "react";
import { Mail, Plus, ExternalLink, Bell, BellOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

interface ContactCardProps {
  contact: {
    id: string;
    name: string;
    title: string;
    company: string;
    email: string;
    confidence: number;
    researchMentionThis?: string;
    sourceUrl?: string;
  };
  onDraftEmail: (contactId: string) => void;
  onSave?: (contactId: string) => void;
  isDrafting?: boolean;
  isPro?: boolean;
}

export function ContactCard({
  contact,
  onDraftEmail,
  onSave,
  isDrafting,
}: ContactCardProps) {
  const [reminderActive, setReminderActive] = useState(false);
  const [isSettingReminder, setIsSettingReminder] = useState(false);

  const handleReminder = async () => {
    setIsSettingReminder(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/reminder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderActive: !reminderActive }),
      });
      const data = await res.json();
      if (data.success) {
        setReminderActive(!reminderActive);
        toast.success(
          reminderActive ? "Reminder cleared" : "Reminder set for 7 days",
        );
      }
    } catch {
      toast.error("Failed to set reminder");
    } finally {
      setIsSettingReminder(false);
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "bg-success";
    if (conf >= 0.5) return "bg-warning";
    return "bg-error";
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return "High";
    if (conf >= 0.5) return "Medium";
    return "Low";
  };

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
      <div className="max-w-[85%] bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-accent/30 transition-all">
        {/* Top: Header Info */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-text-primary leading-tight">
              {contact.name}
            </h3>
            <p className="text-[13px] text-text-secondary mt-0.5">
              {contact.title} at {contact.company}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-border/50 border border-border">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                getConfidenceColor(contact.confidence),
              )}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              {getConfidenceText(contact.confidence)}
            </span>
          </div>
        </div>

        {/* Email Display */}
        {contact.email && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-primary/30 rounded-lg border border-border/40">
            <Mail className="w-3.5 h-3.5 text-accent" />
            <code className="text-[13px] font-mono text-text-primary">
              {contact.email}
            </code>
          </div>
        )}

        {/* Personalization Hook */}
        {contact.researchMentionThis && (
          <div className="mb-5 p-3 bg-accent/5 rounded-xl border border-accent/10 italic text-[13px] text-text-secondary leading-relaxed">
            &quot;{contact.researchMentionThis}&quot;
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <Button
            onClick={() => onDraftEmail(contact.id)}
            variant="primary"
            className="flex-1 h-9 text-[12px] font-bold uppercase tracking-wider"
            isLoading={isDrafting}
          >
            Draft_Email
          </Button>
          <Button
            onClick={() => onSave?.(contact.id)}
            variant="outline"
            className="h-9 w-9 p-0 flex items-center justify-center border-border"
            title="Save to Pipeline"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleReminder}
            variant="outline"
            className="h-9 w-9 p-0 flex items-center justify-center border-border"
            title={reminderActive ? "Clear reminder" : "Remind me in 7 days"}
            isLoading={isSettingReminder}
          >
            {reminderActive ? (
              <BellOff className="w-3.5 h-3.5" />
            ) : (
              <Bell className="w-3.5 h-3.5" />
            )}
          </Button>
          {contact.sourceUrl && (
            <a
              href={contact.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-elevated transition-colors"
              title="View Source"
            >
              <ExternalLink className="w-4 h-4 text-text-secondary" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
