"use client";

// Client islands for settings page interactive actions
// Isolated as client components to keep settings/page.tsx as a server component

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}

export function ManageSubscriptionButton() {
  async function handleManage() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <Button variant="secondary" onClick={handleManage}>
      Manage subscription
    </Button>
  );
}
