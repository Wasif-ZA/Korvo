"use client";

// Client islands for settings page interactive actions
// Isolated as client components to keep settings/page.tsx as a server component

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiKeyInput } from "@/components/app/ApiKeyInput";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

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
    } catch (error) {
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

export function AccountForm({ initialName, email, avatarUrl }: any) {
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
    } catch (error) {
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
            <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">Display Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">Email Address</label>
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
    } catch (error) {
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
          * Your keys are encrypted using AES-256 before storage and never exposed to the frontend after being saved.
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
    } catch (error) {
      toast.error("Failed to update defaults");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">Default Target Role</label>
          <Input 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            placeholder="e.g. Junior Software Engineer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">Default Location</label>
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
