"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalyticsOptOutSection } from "@/components/app/AnalyticsOptOutSection";
import { GmailStatusBadge } from "@/components/app/GmailStatusBadge";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { Mail, Shield, ExternalLink, Loader2 } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SettingsView() {
  const [plan, setPlan] = useState<string>("free");

  const { data: gmailStatus, isLoading: isGmailLoading } = useSWR<{
    connected: boolean;
    dailySent: number;
    dailyLimit: number;
    suspended: boolean;
    reconnectRequired: boolean;
  }>("/api/gmail/status", fetcher);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlan(data.data.plan || "free");
        }
      });
  }, []);

  const handleConnectGmail = () => {
    window.location.href = "/api/gmail/connect";
  };

  const handleDisconnectGmail = async () => {
    try {
      const res = await fetch("/api/gmail/disconnect", { method: "POST" });
      if (res.ok) {
        toast.success("Gmail disconnected");
        window.location.reload();
      } else {
        toast.error("Failed to disconnect Gmail");
      }
    } catch {
      toast.error("Failed to disconnect Gmail");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary font-serif">
          Settings
        </h2>
        <p className="text-[13px] text-text-muted mt-1">
          Manage your account and integrations.
        </p>
      </div>

      <div className="space-y-8">
        {/* Plan Section */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-accent" />
            <h3 className="text-[15px] font-bold text-text-primary uppercase tracking-wider">
              Your Plan
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-text-primary font-medium capitalize">
                {plan} Plan
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                {plan === "pro"
                  ? "50 searches/month, Gmail send, priority support"
                  : "5 searches/month, copy-to-clipboard send"}
              </p>
            </div>
            {plan !== "pro" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = "/?view=pricing")}
              >
                Upgrade to Pro
              </Button>
            )}
          </div>
        </section>

        {/* Gmail Integration */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-accent" />
            <h3 className="text-[15px] font-bold text-text-primary uppercase tracking-wider">
              Gmail Integration
            </h3>
          </div>

          {isGmailLoading ? (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[13px]">Checking status...</span>
            </div>
          ) : gmailStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <GmailStatusBadge
                  dailySent={gmailStatus.dailySent}
                  dailyLimit={gmailStatus.dailyLimit}
                  suspended={gmailStatus.suspended}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGmail}
                  className="text-error border-error/30 hover:bg-error/5"
                >
                  Disconnect
                </Button>
              </div>
              {gmailStatus.reconnectRequired && (
                <div className="bg-warning-bg border border-warning/20 rounded-lg p-3">
                  <p className="text-[12px] text-warning font-medium">
                    Gmail token expired —{" "}
                    <button
                      onClick={handleConnectGmail}
                      className="underline hover:no-underline"
                    >
                      reconnect now
                    </button>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-text-muted">
                Connect Gmail to send outreach emails directly from Korvo.
              </p>
              {plan === "pro" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConnectGmail}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Connect Gmail
                </Button>
              ) : (
                <p className="text-[12px] text-text-muted italic">
                  Available on Pro plan.{" "}
                  <Link
                    href="/?view=pricing"
                    className="text-accent hover:underline"
                  >
                    Upgrade
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>

        {/* Analytics */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <AnalyticsOptOutSection />
        </section>

        {/* Legal Links */}
        <section className="flex gap-4 text-[12px] text-text-muted">
          <a href="/privacy" className="hover:text-accent transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-accent transition-colors">
            Terms of Service
          </a>
        </section>
      </div>
    </div>
  );
}
