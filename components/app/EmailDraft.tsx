"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, RefreshCw, Mail, X, Check, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GmailStatusBadge } from "@/components/app/GmailStatusBadge";
import { toast } from "react-hot-toast";
import { useDebounce } from "use-debounce";
import useSWR, { mutate } from "swr";

interface GmailStatus {
  connected: boolean;
  gmailEmail: string | null;
  connectedAt: string | null;
  dailySent: number;
  dailyLimit: number;
  suspended: boolean;
  reconnectRequired: boolean;
}

interface EmailDraftProps {
  draft: {
    id: string;
    subject: string;
    body: string;
    hook_used: string;
  };
  email: string;
  contactId: string;
  isPro: boolean;
  onClose: () => void;
  onSave?: (subject: string, body: string) => void;
  onRegenerate?: () => void;
  onStageMoved?: (contactId: string, stage: string) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EmailDraft({
  draft,
  email,
  contactId,
  isPro,
  onClose,
  onSave,
  onRegenerate,
  onStageMoved,
}: EmailDraftProps) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const [debouncedSubject] = useDebounce(subject, 800);
  const [debouncedBody] = useDebounce(body, 800);

  // Fetch Gmail status only for Pro users
  const { data: gmailStatus } = useSWR<GmailStatus>(
    isPro ? "/api/gmail/status" : null,
    fetcher,
  );

  const isGmailConnected = gmailStatus?.connected ?? false;
  const isGmailReady =
    isGmailConnected &&
    !gmailStatus?.suspended &&
    !gmailStatus?.reconnectRequired;

  // Auto-save logic
  const saveDraft = useCallback(
    async (s: string, b: string) => {
      if (s === draft.subject && b === draft.body) return;

      setIsSaving(true);
      try {
        const res = await fetch(`/api/drafts/${draft.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: s, body: b }),
        });

        if (res.ok) {
          setHasUnsavedChanges(false);
          onSave?.(s, b);
        }
      } catch {
        // Silent failure — hasUnsavedChanges stays true so user sees "Unsaved changes" label
      } finally {
        setIsSaving(false);
      }
    },
    [draft.id, draft.subject, draft.body, onSave],
  );

  useEffect(() => {
    if (debouncedSubject !== draft.subject || debouncedBody !== draft.body) {
      saveDraft(debouncedSubject, debouncedBody);
    }
  }, [debouncedSubject, debouncedBody, draft.subject, draft.body, saveDraft]);

  const handleCopy = () => {
    const text = `To: ${email}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Full draft copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTextChange = (field: "subject" | "body", value: string) => {
    if (field === "subject") setSubject(value);
    if (field === "body") setBody(value);
    setHasUnsavedChanges(true);
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
      toast.error(
        "You've reached your daily send limit to protect your sender reputation.",
      );
      return;
    }

    setIsSending(true);
    // Optimistic: move contact to "contacted" (per D-08)
    onStageMoved?.(contactId, "contacted");

    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreachId: draft.id, contactId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as {
          error?: string;
          code?: string;
          used?: number;
          limit?: number;
        };

        if (data.code === "GMAIL_NOT_CONNECTED") {
          toast.error("Gmail disconnected — reconnect in Settings");
        } else if (data.code === "DAILY_LIMIT_REACHED") {
          toast.error(
            data.error ??
              "You've reached your daily send limit to protect your sender reputation.",
          );
        } else if (data.code === "BOUNCE_SUSPENDED") {
          toast.error(
            data.error ??
              "Sending paused — too many bounces. Check your email addresses.",
          );
        } else {
          toast.error(data.error ?? "Send failed");
        }

        // Revert optimistic update on failure
        onStageMoved?.(contactId, "identified");
        setIsSending(false);
        return;
      }

      setIsSent(true);
      setIsSending(false);
      toast.success(`Email sent to ${email}`);
      // Invalidate gmail status to refresh counter
      mutate("/api/gmail/status");
    } catch {
      toast.error("Failed to send — try again");
      onStageMoved?.(contactId, "identified");
      setIsSending(false);
    }
  };

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const isAtDailyLimit =
    gmailStatus !== undefined &&
    gmailStatus.dailySent >= gmailStatus.dailyLimit;

  return (
    <div className="p-8 space-y-6 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-[12px] font-mono font-bold text-text-muted uppercase tracking-[0.2em]">
            {"// Email_Draft_Buffer \\\\"}
          </h4>
          {isSaving ? (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent animate-pulse uppercase font-bold">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </div>
          ) : hasUnsavedChanges ? (
            <span className="text-[10px] font-mono text-text-muted uppercase italic">
              Unsaved changes
            </span>
          ) : null}
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-text-muted w-16 uppercase">
            To:
          </span>
          <code className="text-sm bg-surface-alt px-2 py-1 rounded border border-border-card text-text-primary">
            {email}
          </code>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-text-muted w-16 uppercase">
            Subject:
          </span>
          <Input
            value={subject}
            onChange={(e) => handleTextChange("subject", e.target.value)}
            className="flex-1 font-sans text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-text-muted uppercase block">
            Body:
          </label>
          <textarea
            value={body}
            onChange={(e) => handleTextChange("body", e.target.value)}
            className="w-full min-h-[240px] bg-surface-alt border border-border-card rounded-lg p-4 text-[15px] leading-relaxed text-text-body font-sans focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent transition-all"
          />
          {/* Unsubscribe footer preview (D-15) — only shown for Pro+connected */}
          {isPro && isGmailConnected && (
            <p className="text-xs text-text-tertiary italic mt-2">
              Footer: If you&apos;d prefer not to hear from me, just let me
              know.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-border-card">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-muted uppercase">
            Hook used:
          </span>
          <span className="text-[10px] font-mono font-bold text-accent uppercase bg-accent-bg px-2 py-0.5 rounded border border-accent/10">
            {draft.hook_used}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>

            {/* Pro + Gmail connected: all three buttons */}
            {isPro && isGmailConnected ? (
              <>
                <a href={mailtoLink} className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Open in Mail
                  </Button>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendViaGmail}
                  disabled={isSent || isSending || isAtDailyLimit}
                  title={
                    isAtDailyLimit
                      ? `Daily limit reached (${gmailStatus?.dailyLimit}/day). Resets tomorrow.`
                      : undefined
                  }
                  className="flex-1 sm:flex-none min-w-[160px]"
                >
                  {isSent ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Sent
                    </>
                  ) : isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send via Gmail
                    </>
                  )}
                </Button>
              </>
            ) : isPro && !isGmailConnected ? (
              /* Pro + not connected: Copy primary, connect link */
              <>
                <a href={mailtoLink} className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Open in Mail
                  </Button>
                </a>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none min-w-[140px]"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* Free user: Copy primary, Mailto secondary — NO Send via Gmail */
              <>
                <a href={mailtoLink} className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Open in Mail
                  </Button>
                </a>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none min-w-[140px]"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Connect Gmail link for Pro unconnected users */}
          {isPro && !isGmailConnected && (
            <a
              href="/settings?section=gmail"
              className="text-[11px] text-accent hover:underline font-mono"
            >
              Connect Gmail to send directly
            </a>
          )}

          {/* Daily counter badge for Pro+connected users */}
          {isPro && isGmailConnected && gmailStatus && (
            <GmailStatusBadge
              dailySent={gmailStatus.dailySent}
              dailyLimit={gmailStatus.dailyLimit}
              suspended={gmailStatus.suspended}
            />
          )}
        </div>
      </div>
    </div>
  );
}
