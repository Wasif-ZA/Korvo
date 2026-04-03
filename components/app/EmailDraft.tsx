"use client";

import { useState } from "react";
import { Copy, RefreshCw, Mail, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";

interface EmailDraftProps {
  draft: {
    id: string;
    subject: string;
    body: string;
    hook_used: string;
  };
  email: string;
  onClose: () => void;
  onSave?: (subject: string, body: string) => void;
  onRegenerate?: () => void;
}

export function EmailDraft({ draft, email, onClose, onSave, onRegenerate }: EmailDraftProps) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    const text = `To: ${email}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Full draft copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-8 space-y-6 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-[12px] font-mono font-bold text-text-muted uppercase tracking-[0.2em]">
          // Email_Draft_Buffer \\
        </h4>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-text-muted w-16 uppercase">To:</span>
          <code className="text-sm bg-surface-alt px-2 py-1 rounded border border-border-card text-text-primary">
            {email}
          </code>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-text-muted w-16 uppercase">Subject:</span>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 font-sans text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-text-muted uppercase block">Body:</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full min-h-[240px] bg-surface-alt border border-border-card rounded-lg p-4 text-[15px] leading-relaxed text-text-body font-sans focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-border-card">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-muted uppercase">Hook used:</span>
          <span className="text-[10px] font-mono font-bold text-accent uppercase bg-accent-bg px-2 py-0.5 rounded border border-accent/10">
            {draft.hook_used}
          </span>
        </div>

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
        </div>
      </div>
    </div>
  );
}
