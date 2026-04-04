"use client";

// Client islands for settings page interactive actions
// Isolated as client components to keep settings/page.tsx as a server component

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiKeyInput } from "@/components/app/ApiKeyInput";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import useSWR, { mutate } from "swr";
import { Mail, CheckCircle, AlertTriangle, X } from "lucide-react";

interface GmailStatus {
  connected: boolean;
  gmailEmail: string | null;
  connectedAt: string | null;
  dailySent: number;
  dailyLimit: number;
  suspended: boolean;
  reconnectRequired: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleManage() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleManage} isLoading={isLoading}>
      Manage Billing
    </Button>
  );
}

interface AccountFormProps {
  initialName: string;
  email: string;
  avatarUrl: string | null;
}

export function AccountForm({
  initialName,
  email,
  avatarUrl,
}: AccountFormProps) {
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSave() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });
      if (res.ok) {
        toast.success("Profile updated");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8">
      <div className="flex items-center gap-6 w-full max-w-md">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover border border-border-card"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-accent-bg flex items-center justify-center text-accent text-xl font-bold border border-accent/20">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="space-y-4 flex-1">
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">
              Display Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">
              Email Address
            </label>
            <p className="text-sm text-text-body font-mono">{email}</p>
          </div>
        </div>
      </div>
      <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
        Save Changes
      </Button>
    </div>
  );
}

export function ApiKeyForm({ isPro }: { isPro: boolean }) {
  const [apolloKey, setApolloKey] = useState("");
  const [hunterKey, setHunterKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSave() {
    if (!isPro) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apolloKey, hunterKey }),
      });
      if (res.ok) {
        toast.success("API keys saved securely");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to save API keys");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ApiKeyInput
          label="Apollo API Key"
          value={apolloKey}
          onChange={setApolloKey}
          isLocked={!isPro}
          placeholder="sk_ap_..."
        />
        <ApiKeyInput
          label="Hunter.io API Key"
          value={hunterKey}
          onChange={setHunterKey}
          isLocked={!isPro}
          placeholder="ht_..."
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-border-card">
        <p className="text-[11px] text-text-muted max-w-sm italic">
          * Your keys are encrypted using AES-256 before storage and never
          exposed to the frontend after being saved.
        </p>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!isPro}
          isLoading={isLoading}
        >
          Save Keys
        </Button>
      </div>
    </div>
  );
}

export function DefaultsForm() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSave() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults: { role, location } }),
      });
      if (res.ok) {
        toast.success("Pipeline defaults updated");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to update defaults");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">
            Default Target Role
          </label>
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Junior Software Engineer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">
            Default Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Sydney, Australia"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border-card">
        <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
          Save Defaults
        </Button>
      </div>
    </div>
  );
}

export function GmailConnectionSection({ isPro }: { isPro: boolean }) {
  const searchParams = useSearchParams();
  const { data: gmailStatus, isLoading } = useSWR<GmailStatus>(
    "/api/gmail/status",
    fetcher,
  );
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Handle OAuth return URL params (D-02)
  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (gmailParam === "connected") {
      toast.success("Gmail connected successfully");
      mutate("/api/gmail/status");
    } else if (gmailParam === "error") {
      toast.error("Failed to connect Gmail — please try again");
    }
  }, [searchParams]);

  async function handleDisconnect() {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/gmail/disconnect", { method: "DELETE" });
      if (res.ok) {
        toast.success("Gmail disconnected");
        mutate("/api/gmail/status");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to disconnect Gmail");
    } finally {
      setIsDisconnecting(false);
    }
  }

  if (!isPro) {
    return (
      <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-alt border border-border-card opacity-75">
        <Mail className="w-5 h-5 text-text-muted mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">
            Gmail Integration
          </p>
          <p className="text-sm text-text-muted">
            Upgrade to Pro to send emails directly from Korvo via your Gmail
            account.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-surface-alt border border-border-card animate-pulse h-20" />
    );
  }

  // Reconnect required (D-03, D-04)
  if (gmailStatus?.reconnectRequired) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-amber-300">
              Gmail connection expired
            </p>
            <p className="text-sm text-text-muted">
              Reconnect to continue sending emails directly from Korvo.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              window.location.href = "/api/gmail/connect";
            }}
          >
            Reconnect Gmail
          </Button>
        </div>
      </div>
    );
  }

  // Bounce suspended (D-12)
  if (gmailStatus?.suspended) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <X className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-red-300">Sending paused</p>
            <p className="text-sm text-text-muted">
              Too many bounces detected. Check your email addresses before
              resuming.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate("/api/gmail/status")}
          >
            Refresh status
          </Button>
        </div>

        {/* Show disconnect option even when suspended */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted font-mono">
            {gmailStatus.gmailEmail ?? "Gmail connected"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            isLoading={isDisconnecting}
          >
            Disconnect Gmail
          </Button>
        </div>
      </div>
    );
  }

  // Connected state
  if (gmailStatus?.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-emerald-300">
              Gmail connected
            </p>
            {gmailStatus.gmailEmail && (
              <p className="text-sm text-text-muted font-mono">
                {gmailStatus.gmailEmail}
              </p>
            )}
            {gmailStatus.connectedAt && (
              <p className="text-xs text-text-tertiary">
                Connected{" "}
                {new Date(gmailStatus.connectedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            isLoading={isDisconnecting}
          >
            Disconnect Gmail
          </Button>
        </div>
        <p className="text-xs text-text-muted italic">
          {gmailStatus.dailySent}/{gmailStatus.dailyLimit} emails sent today.
          Daily limit resets at midnight.
        </p>
      </div>
    );
  }

  // Not connected (Pro)
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-alt border border-border-card">
        <Mail className="w-5 h-5 text-text-muted mt-0.5 shrink-0" />
        <div className="space-y-1 flex-1">
          <p className="text-sm font-semibold text-text-primary">
            Connect your Gmail
          </p>
          <p className="text-sm text-text-muted">
            Send emails directly from Korvo using your own Gmail account.
            We&apos;ll only request permission to send — never read your inbox.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            window.location.href = "/api/gmail/connect";
          }}
        >
          Connect Gmail
        </Button>
      </div>
    </div>
  );
}

export function UnsubscribeFooterEditor({
  defaultFooter,
}: {
  defaultFooter: string;
}) {
  const [footer, setFooter] = useState(defaultFooter);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unsubscribeFooter: footer }),
      });
      if (res.ok) {
        toast.success("Unsubscribe footer saved");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to save footer");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">
          Unsubscribe footer
        </label>
        <p className="text-xs text-text-muted">
          Appended to every email sent via Gmail. Keep it casual — this is
          personal outreach, not bulk marketing.
        </p>
      </div>
      <div className="flex gap-3 items-start">
        <Input
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
          placeholder="If you'd prefer not to hear from me, just let me know."
          className="flex-1 font-sans text-sm"
          maxLength={200}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
        >
          Save
        </Button>
      </div>
      <p className="text-[10px] text-text-tertiary font-mono">
        {footer.length}/200 characters
      </p>
    </div>
  );
}
