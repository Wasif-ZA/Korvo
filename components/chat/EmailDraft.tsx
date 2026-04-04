"use client";

import { useState } from "react";
import { Copy, Mail, RefreshCw, Check, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { track } from "@/lib/analytics/track";
import useSWR, { mutate } from "swr";

interface EmailDraftProps {
  draft: {
    id: string;
    contact_id: string;
    company: string;
    subject: string;
    body: string;
    hook_used?: string;
    email?: string; // recipient email for Gmail send
  };
  onRegenerate: (draftId: string) => void;
  isRegenerating?: boolean;
  isPro?: boolean;
  contactId?: string;
  onStageMoved?: (contactId: string, stage: string) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EmailDraft({
  draft,
  onRegenerate,
  isRegenerating,
  isPro,
  contactId,
  onStageMoved,
}: EmailDraftProps) {
  const [copied, setCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [editableSubject, setEditableSubject] = useState(draft.subject);
  const [editableBody, setEditableBody] = useState(draft.body);
  const [isSending, setIsSending] = useState(false);
  const [isSentViaGmail, setIsSentViaGmail] = useState(false);

  const { data: gmailStatus } = useSWR<{
    connected: boolean;
    dailySent: number;
    dailyLimit: number;
    suspended: boolean;
    reconnectRequired: boolean;
  }>(isPro ? "/api/gmail/status" : null, fetcher);

  const isGmailConnected = gmailStatus?.connected ?? false;
  const isGmailReady =
    isGmailConnected &&
    !gmailStatus?.suspended &&
    !gmailStatus?.reconnectRequired;

  const handleCopy = () => {
    const text = `Subject: ${editableSubject}\n\n${editableBody}`;
    navigator.clipboard.writeText(text);
    setCopied(true);

    track("email_copied", {
      contact_id: draft.contact_id,
      company: draft.company,
    });

    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const openGmail = () => {
    const mailtoUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(editableSubject)}&body=${encodeURIComponent(editableBody)}`;

    track("email_sent", {
      contact_id: draft.contact_id,
      company: draft.company,
      method: "mailto",
    });

    window.open(mailtoUrl, "_blank");
  };

  const handleSendViaGmail = async () => {
    if (!isGmailReady) {
      if (gmailStatus?.reconnectRequired) {
        toast.error("Gmail disconnected — reconnect in Settings");
      } else {
        toast.error("Connect Gmail in Settings first");
      }
      return;
    }

    if (gmailStatus && gmailStatus.dailySent >= gmailStatus.dailyLimit) {
      toast.error("Daily send limit reached. Resets tomorrow.");
      return;
    }

    const cId = contactId || draft.contact_id;
    setIsSending(true);
    onStageMoved?.(cId, "contacted"); // Optimistic update

    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreachId: draft.id, contactId: cId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as {
          error?: string;
          code?: string;
        };

        if (data.code === "GMAIL_NOT_CONNECTED") {
          toast.error("Gmail disconnected — reconnect in Settings");
        } else if (data.code === "DAILY_LIMIT_REACHED") {
          toast.error(data.error ?? "Daily send limit reached.");
        } else if (data.code === "BOUNCE_SUSPENDED") {
          toast.error(data.error ?? "Sending paused — too many bounces.");
        } else {
          toast.error(data.error ?? "Send failed");
        }

        onStageMoved?.(cId, "identified"); // Revert optimistic update
        setIsSending(false);
        return;
      }

      setIsSentViaGmail(true);
      setIsSending(false);
      track("email_sent", {
        contact_id: cId,
        company: draft.company,
        method: "gmail",
      });
      toast.success("Email sent via Gmail");
      mutate("/api/gmail/status"); // Refresh daily counter
    } catch {
      toast.error("Failed to send — try again");
      onStageMoved?.(cId, "identified"); // Revert optimistic update
      setIsSending(false);
    }
  };

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="max-w-[90%] w-full bg-card border border-border rounded-2xl overflow-hidden shadow-lg mt-2">
        {/* Header */}
        <div className="bg-elevated px-4 py-2 border-b border-border flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Email_Draft
          </span>
          {draft.hook_used && (
            <span className="text-[10px] text-accent font-medium px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
              Personalized
            </span>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Subject */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">
              Subject
            </label>
            <input
              type="text"
              value={editableSubject}
              onChange={(e) => setEditableSubject(e.target.value)}
              className="w-full bg-primary/50 border border-border/60 rounded-lg px-3 py-2 text-[14px] text-text-primary focus:border-accent/50 focus:ring-0 transition-colors"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">
              Message
            </label>
            <textarea
              rows={6}
              value={editableBody}
              onChange={(e) => setEditableBody(e.target.value)}
              className="w-full bg-primary/50 border border-border/60 rounded-lg px-3 py-2 text-[14px] text-text-primary focus:border-accent/50 focus:ring-0 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 h-9 text-[11px] font-bold border-border/60"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 mr-2" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-2" />
              )}
              {copied ? "COPIED" : "COPY_TEXT"}
            </Button>

            {isPro && isGmailReady ? (
              <Button
                onClick={handleSendViaGmail}
                variant="primary"
                className="flex-1 h-9 text-[11px] font-bold"
                disabled={isSentViaGmail || isSending}
              >
                {isSentViaGmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-2" />
                    SENT
                  </>
                ) : isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    SENDING
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-2" />
                    SEND_VIA_GMAIL
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={openGmail}
                variant="outline"
                className="flex-1 h-9 text-[11px] font-bold border-border/60"
              >
                <Mail className="w-3.5 h-3.5 mr-2" />
                GMAIL
              </Button>
            )}

            <Button
              onClick={() => onRegenerate(draft.id)}
              variant="outline"
              className="h-9 w-9 p-0 border-border/60"
              isLoading={isRegenerating}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>

            {/* Pro + not connected: show connect link */}
            {isPro && !isGmailConnected && (
              <div className="w-full text-center mt-1">
                <span
                  className="text-[10px] text-accent cursor-pointer hover:underline"
                  onClick={() => (window.location.href = "/?view=settings")}
                >
                  Connect Gmail to send directly
                </span>
              </div>
            )}

            {/* Mark as sent checkbox (for non-Gmail sends) */}
            {!(isPro && isGmailReady) && (
              <div className="w-full sm:w-auto ml-auto flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isSent}
                    onChange={(e) => setIsSent(e.target.checked)}
                    className="rounded border-border bg-primary text-accent focus:ring-offset-0 focus:ring-accent"
                  />
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider transition-colors",
                      isSent
                        ? "text-success"
                        : "text-text-secondary group-hover:text-text-primary",
                    )}
                  >
                    {isSent ? "MARKED_AS_SENT" : "MARK_AS_SENT"}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
