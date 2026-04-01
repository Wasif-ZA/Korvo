// Settings page — server component
// Fetches user profile from Prisma (profiles table, per D-14/FOUND-04)
// Handles auth redirect if unauthenticated

import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import {
  SignOutButton,
  ManageSubscriptionButton,
} from "./SettingsClient";

export const metadata = {
  title: "Settings — Korvo",
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
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
    },
  });

  const displayName = profile?.fullName ?? user.email ?? "User";
  const avatarUrl = profile?.avatarUrl ?? null;
  const plan = profile?.plan ?? "free";
  const email = profile?.email ?? user.email ?? "";
  const isPro = plan === "pro" && !!profile?.stripeCustomerId;

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-[#1C1C1A]">Settings</h1>

      {/* Account section */}
      <div className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-[#1C1C1A]">Account</h2>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-xl font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-[#1C1C1A]">
                {displayName}
              </p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E5E4E0]">
            <SignOutButton />
          </div>
        </Card>
      </div>

      {/* Subscription section */}
      <div className="mt-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-[#1C1C1A]">
            Subscription
          </h2>
          <p className="text-sm text-gray-500">Current plan</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-semibold text-[#1C1C1A]">
              {isPro ? "Pro" : "Free"}
            </p>
            {isPro && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full font-medium">
                Pro
              </span>
            )}
          </div>

          {isPro ? (
            <div className="mt-6 flex flex-col gap-3">
              <ManageSubscriptionButton />
              <p className="text-xs text-gray-500">
                Cancel subscription: Your plan stays active until the end of
                your billing period. After that, you&apos;ll return to the Free
                tier. Your data stays safe.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-base font-semibold text-[#1C1C1A]">
                You&apos;re on the Free plan
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Upgrade to Pro to unlock 50 searches/month and send directly
                from Korvo.
              </p>
              <div className="mt-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-lg font-semibold h-11 px-4 text-sm bg-teal-600 text-white hover:bg-teal-700 transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
