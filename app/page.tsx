"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { HeroPrompt } from "@/components/chat/HeroPrompt";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { ContactCard } from "@/components/chat/ContactCard";
import { SystemMessage } from "@/components/chat/SystemMessage";
import { EmailDraft } from "@/components/chat/EmailDraft";
import { AuthGate } from "@/components/chat/AuthGate";
import { Sidebar } from "@/components/chat/Sidebar";
import { PipelineView } from "@/components/chat/PipelineView";
import { SettingsView } from "@/components/chat/SettingsView";
import { PricingView } from "@/components/chat/PricingView";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";
import { track } from "@/lib/analytics/track";

// Message Types
export type MessageType =
  | "user"
  | "system"
  | "contact-card"
  | "email-draft"
  | "auth-gate"
  | "thinking";

export interface Message {
  id: string;
  type: MessageType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  timestamp: Date;
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>(
    {},
  );
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeView, setActiveView] = useState<
    "chat" | "pipeline" | "settings" | "pricing"
  >("chat");

  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Fallback guest adoption (AUTH-04) — server-side adoption may have been skipped
        const guestSession = localStorage.getItem("korvo_guest_session");
        if (guestSession) {
          fetch("/api/guest/adopt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestSessionId: guestSession }),
          }).then(() => {
            localStorage.removeItem("korvo_guest_session");
          });
        }
      }
    });

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfile(data.data);
      });

    const storedCount = localStorage.getItem("korvo_search_count");
    if (storedCount) {
      setSearchCount(parseInt(storedCount, 10));
    }

    const view = searchParams.get("view");
    if (view === "settings" || view === "pricing" || view === "pipeline") {
      setActiveView(view as "settings" | "pricing" | "pipeline");
    }

    if (searchParams.get("event") === "signup") {
      addMessage({
        type: "system",
        content: "Welcome back! Your pipeline is ready.",
      });
      track("signup", { provider: "google" });
      window.history.replaceState({}, "", "/");
    }

    if (searchParams.get("session_id")) {
      track("upgrade", { plan: "pro", source: "stripe_checkout" });
      addMessage({
        type: "system",
        content:
          "Welcome to Pro! You now have 50 searches/month and Gmail send.",
      });
      window.history.replaceState({}, "", "/");
      // Refresh profile to get updated plan
      fetch("/api/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setProfile(data.data);
        });
    }
  }, [searchParams]);

  const incrementSearchCount = () => {
    const newCount = searchCount + 1;
    setSearchCount(newCount);
    localStorage.setItem("korvo_search_count", newCount.toString());
  };

  const addMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      const newMessage: Message = {
        ...message,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [],
  );

  const pollSearch = async (searchId: string) => {
    let pollCount = 0;
    const maxPolls = 40; // ~2 minutes at 3s intervals
    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        setIsSearching(false);
        setMessages((prev) => prev.filter((m) => m.type !== "thinking"));
        addMessage({
          type: "system",
          content:
            "Search timed out. The pipeline may still be processing — try refreshing later.",
        });
        return;
      }
      try {
        const res = await fetch(`/api/search/${searchId}`);
        if (!res.ok) {
          if (res.status === 404) {
            clearInterval(interval);
            setIsSearching(false);
            addMessage({ type: "system", content: "Search not found." });
          }
          return;
        }
        const result = await res.json();

        if (result.success && result.data.pipeline_status === "complete") {
          clearInterval(interval);
          setIsSearching(false);

          setMessages((prev) => prev.filter((m) => m.type !== "thinking"));

          track("search_completed", {
            company: result.data.company,
            role: result.data.role,
            location: "remote",
            contacts_found: result.data.contacts.length,
          });

          addMessage({
            type: "system",
            content: `Found ${result.data.contacts.length} contacts at ${result.data.company}.`,
          });

          const newDrafts: Record<string, Record<string, unknown>> = {};
          result.data.drafts.forEach((d: Record<string, unknown>) => {
            const contact = result.data.contacts.find(
              (c: Record<string, unknown>) => c.name === d.contact_name,
            );
            if (contact) {
              newDrafts[contact.id as string] = d;
            }
          });
          setDrafts((prev) => ({ ...prev, ...newDrafts }));

          result.data.contacts.forEach(
            (contact: Record<string, unknown>, index: number) => {
              setTimeout(
                () => {
                  addMessage({
                    type: "contact-card",
                    content: { ...contact, company: result.data.company },
                  });
                },
                (index + 1) * 300,
              );
            },
          );

          incrementSearchCount();
        } else if (result.success && result.data.pipeline_status === "failed") {
          clearInterval(interval);
          setIsSearching(false);
          setMessages((prev) => prev.filter((m) => m.type !== "thinking"));
          addMessage({
            type: "system",
            content: "Sorry, the search failed. Please try again.",
          });
        }
      } catch {
        clearInterval(interval);
        setIsSearching(false);
        setMessages((prev) => prev.filter((m) => m.type !== "thinking"));
        addMessage({
          type: "system",
          content: "Connection error while checking search status.",
        });
      }
    }, 3000);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    const guestSessionId =
      localStorage.getItem("korvo_guest_session") || "browser-session";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?guest_session=${encodeURIComponent(guestSessionId)}`,
      },
    });
    if (error) {
      toast.error("Login failed");
      setIsLoggingIn(false);
    }
  };

  const handleSend = async (text: string) => {
    if (isSearching) return;
    addMessage({ type: "user", content: text });

    if (!user && searchCount >= 1) {
      addMessage({ type: "auth-gate", content: null });
      return;
    }

    setIsSearching(true);
    addMessage({ type: "thinking", content: null });

    if (!user) {
      localStorage.setItem("korvo_guest_session", "browser-session");
    }

    try {
      const company = text.split("at ")[1] || text.split("for ")[1] || text;
      const role = text.split("for ")[1] || "Software Engineer";

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          guestSessionId: "browser-session",
        }),
      });

      const data = await res.json();

      if (data.limitReached) {
        setIsSearching(false);
        setMessages((prev) => prev.filter((m) => m.type !== "thinking"));
        addMessage({ type: "auth-gate", content: null });
        return;
      }

      if (data.searchId) {
        pollSearch(data.searchId);
      } else {
        throw new Error("No searchId returned");
      }
    } catch {
      toast.error("Search failed");
      setIsSearching(false);
      setMessages((prev) => prev.filter((m) => m.type !== "thinking"));
    }
  };

  const handleDraftEmail = (contactId: string) => {
    const draft = drafts[contactId];
    const contactMessage = messages.find(
      (m) => m.type === "contact-card" && m.content.id === contactId,
    );

    if (draft && contactMessage) {
      addMessage({
        type: "email-draft",
        content: {
          ...draft,
          contact_id: contactId,
          company: contactMessage.content.company,
        },
      });
    } else {
      toast.error("Draft not found for this contact.");
    }
  };

  const handleRegenerate = async (draftId: string) => {
    if (!user) {
      addMessage({ type: "auth-gate", content: null });
      return;
    }

    setIsRegenerating(draftId);
    try {
      const res = await fetch(`/api/drafts/${draftId}/regenerate`, {
        method: "POST",
      });
      const result = await res.json();

      if (result.success) {
        const updatedDraft = result.data;
        setDrafts((prev) => {
          const next = { ...prev };
          const contactId = Object.keys(next).find(
            (key) => next[key].id === draftId,
          );
          if (contactId) {
            next[contactId] = updatedDraft;
          }
          return next;
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.type === "email-draft" && m.content.id === draftId
              ? { ...m, content: updatedDraft }
              : m,
          ),
        );

        toast.success("Draft regenerated");
      } else {
        toast.error(result.error || "Failed to regenerate");
      }
    } catch {
      toast.error("Regeneration failed");
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleSaveContact = (_contactId: string) => {
    if (!user) {
      addMessage({ type: "auth-gate", content: null });
      return;
    }
    toast.success("Contact saved to pipeline");
  };

  const handleHistorySelect = async (searchId: string) => {
    if (isSearching) return;

    setIsSearching(true);
    setMessages([
      { id: "loading", type: "thinking", content: null, timestamp: new Date() },
    ]);

    try {
      const res = await fetch(`/api/search/${searchId}`);
      if (!res.ok) {
        throw new Error(`Search request failed (${res.status})`);
      }
      const result = await res.json();

      if (result.success) {
        setMessages([]); // Clear and rebuild

        addMessage({
          type: "user",
          content: `Find contacts at ${result.data.company} for ${result.data.role}`,
        });

        addMessage({
          type: "system",
          content: `Loaded search from ${new Date(result.data.createdAt).toLocaleDateString()}. Found ${result.data.contacts.length} contacts.`,
        });

        const newDrafts: Record<string, Record<string, unknown>> = {};
        result.data.drafts.forEach((d: Record<string, unknown>) => {
          const contact = result.data.contacts.find(
            (c: Record<string, unknown>) => c.name === d.contact_name,
          );
          if (contact) {
            newDrafts[contact.id as string] = d;
          }
        });
        setDrafts((prev) => ({ ...prev, ...newDrafts }));

        result.data.contacts.forEach(
          (contact: Record<string, unknown>, index: number) => {
            setTimeout(
              () => {
                addMessage({
                  type: "contact-card",
                  content: { ...contact, company: result.data.company },
                });
              },
              (index + 1) * 200,
            );
          },
        );
      }
    } catch {
      toast.error("Failed to load search history");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <ChatLayout
      sidebar={
        user ? (
          <Sidebar
            user={user}
            activeView={activeView}
            onViewChange={setActiveView}
            onHistorySelect={handleHistorySelect}
          />
        ) : undefined
      }
    >
      <AnimatePresence mode="wait">
        {activeView === "chat" ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <ChatWindow
              input={
                <ChatInput
                  onSend={handleSend}
                  disabled={isSearching}
                  placeholder={isSearching ? "Searching..." : undefined}
                />
              }
            >
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <motion.div
                    key="hero"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HeroPrompt onSelectExample={handleSend} />
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {m.type === "user" && (
                          <div className="flex justify-end">
                            <div className="max-w-[85%] bg-accent/10 border border-accent/20 rounded-2xl py-3 px-4 text-[15px] text-text-primary font-medium">
                              {m.content}
                            </div>
                          </div>
                        )}

                        {m.type === "system" && (
                          <SystemMessage>{m.content}</SystemMessage>
                        )}

                        {m.type === "thinking" && <ThinkingIndicator />}

                        {m.type === "contact-card" && (
                          <ContactCard
                            contact={m.content}
                            onDraftEmail={handleDraftEmail}
                            onSave={handleSaveContact}
                            isPro={profile?.plan === "pro"}
                          />
                        )}

                        {m.type === "email-draft" && (
                          <EmailDraft
                            draft={m.content}
                            onRegenerate={handleRegenerate}
                            isRegenerating={isRegenerating === m.content.id}
                            isPro={profile?.plan === "pro"}
                            contactId={m.content.contact_id}
                            onStageMoved={(contactId, stage) => {
                              track("pipeline_stage_change", {
                                contact_id: contactId,
                                from_stage: "identified",
                                to_stage: stage,
                              });
                            }}
                          />
                        )}

                        {m.type === "auth-gate" && (
                          <AuthGate
                            onLogin={handleGoogleLogin}
                            isLoading={isLoggingIn}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ChatWindow>
          </motion.div>
        ) : activeView === "pipeline" ? (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 overflow-hidden p-8"
          >
            <PipelineView />
          </motion.div>
        ) : activeView === "settings" ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 overflow-y-auto p-8"
          >
            <SettingsView />
          </motion.div>
        ) : (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 overflow-y-auto p-8"
          >
            <PricingView />
          </motion.div>
        )}
      </AnimatePresence>
    </ChatLayout>
  );
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}
