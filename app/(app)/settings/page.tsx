// Settings page — server component
// Fetches user profile from Prisma (profiles table, per D-14/FOUND-04)
// Handles auth redirect if unauthenticated

import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { UsageBar } from "@/components/app/UsageBar";
import {
  SignOutButton,
  ManageSubscriptionButton,
  AccountForm,
  ApiKeyForm,
  DefaultsForm,
  GmailConnectionSection,
  UnsubscribeFooterEditor,
} from "./SettingsClient";
import { AnalyticsOptOutSection } from "@/components/app/AnalyticsOptOutSection";

export const metadata = {
  title: "Settings — Korvo",
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Per D-14/FOUND-04: read display data from profiles table, NOT user.user_metadata
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      fullName: true,
      avatarUrl: true,
      plan: true,
      email: true,
      stripeCustomerId: true,
      searchesUsedThisMonth: true,
      unsubscribeFooter: true,
    },
  });

  const displayName = profile?.fullName ?? user.email ?? "User";
  const avatarUrl = profile?.avatarUrl ?? null;
  const plan = profile?.plan ?? "free";
  const email = profile?.email ?? user.email ?? "";
  const isPro = plan === "pro";
  const searchesUsed = profile?.searchesUsedThisMonth ?? 0;
  const searchesLimit = isPro ? 50 : 5;
  const defaultFooter =
    profile?.unsubscribeFooter ??
    "If you'd prefer not to hear from me, just let me know.";

  return (
    <div className="space-y-12 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-serif font-semibold text-text-primary">
          Settings
        </h1>
        <p className="text-text-muted">
          Manage your account and engine configurations
        </p>
      </div>

      <div className="space-y-12">
        {/* Account Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
              {"// Account_Profile \\\\"}
            </span>
            <div className="h-px flex-1 bg-border-card" />
          </div>

          <Card className="bg-surface">
            <AccountForm
              initialName={displayName}
              email={email}
              avatarUrl={avatarUrl}
            />
          </Card>
        </section>

        {/* Subscription Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
              {"// Plan_And_Usage \\\\"}
            </span>
            <div className="h-px flex-1 bg-border-card" />
          </div>

          <Card className="bg-surface space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-sm text-text-muted uppercase font-mono font-bold tracking-widest">
                  Current Status
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-semibold text-text-primary uppercase">
                    {isPro ? "Pro Tier" : "Free Tier"}
                  </p>
                  {isPro && (
                    <span className="bg-success-bg text-success text-[10px] px-2 py-0.5 rounded border border-success/20 font-bold uppercase tracking-widest">
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isPro ? (
                  <ManageSubscriptionButton />
                ) : (
                  <Link
                    href="/pricing"
                    className={buttonVariants({ variant: "primary" })}
                  >
                    Upgrade to Pro
                  </Link>
                )}
                <SignOutButton />
              </div>
            </div>

            <div className="pt-8 border-t border-border-card">
              <UsageBar used={searchesUsed} limit={searchesLimit} />
              <p className="mt-4 text-[12px] text-text-muted leading-relaxed max-w-md italic">
                Usage resets on the 1st of every month.{" "}
                {isPro
                  ? "Enjoy unlimited access to the core engine."
                  : "Upgrade to Pro for 50 searches/mo."}
              </p>
            </div>
          </Card>
        </section>

        {/* Gmail Integration Section */}
        <section className="space-y-6" id="gmail">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
              {"// Gmail_Integration \\\\"}
            </span>
            <div className="h-px flex-1 bg-border-card" />
          </div>

          <Card className="bg-surface space-y-6">
            <GmailConnectionSection isPro={isPro} />

            {isPro && (
              <div className="pt-6 border-t border-border-card">
                <UnsubscribeFooterEditor defaultFooter={defaultFooter} />
              </div>
            )}
          </Card>
        </section>

        {/* API Keys Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
              {"// Engine_Access_Keys \\\\"}
            </span>
            <div className="h-px flex-1 bg-border-card" />
          </div>

          <Card
            className={cn("bg-surface", !isPro && "opacity-75 grayscale-[0.5]")}
          >
            <ApiKeyForm isPro={isPro} />
          </Card>
        </section>

        {/* Defaults Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
              {"// Pipeline_Defaults \\\\"}
            </span>
            <div className="h-px flex-1 bg-border-card" />
          </div>

          <Card className="bg-surface">
            <DefaultsForm />
          </Card>
        </section>

        {/* Privacy Controls Section */}
        <section className="space-y-6 pb-20">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
              {"// Privacy_Controls \\\\"}
            </span>
            <div className="h-px flex-1 bg-border-card" />
          </div>

          <Card className="bg-surface">
            <AnalyticsOptOutSection />
          </Card>
        </section>
      </div>
    </div>
  );
}
