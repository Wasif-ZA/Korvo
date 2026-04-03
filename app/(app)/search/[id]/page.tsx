"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Share2, MoreHorizontal, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { ContactCard } from "@/components/app/ContactCard";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

// Mock data based on PipelineResponse (D-14)
const MOCK_RESULTS = {
  company: "Canva",
  role: "Junior Software Engineer",
  pipeline_status: "complete",
  contacts: [
    {
      id: "c1",
      name: "Sarah Chen",
      title: "Engineering Manager",
      company: "Canva",
      email: "sarah.chen@canva.com",
      confidence: "high" as const,
      hooks: [
        {
          text: "Spoke at Config 2025 about scaling design tokens across 40+ teams",
          source: "https://www.canva.dev/blog/config-2025-tokens",
          type: "talk"
        }
      ],
      draft: {
        id: "d1",
        subject: "Your Config talk on design tokens — quick question",
        body: "Hi Sarah,\n\nI watched your Config 2025 talk on scaling design tokens across 40+ teams — the bit about how you handled multi-platform synchronization was particularly relevant to a project I'm working on.\n\nI'm a Junior SWE looking to join a team that values systematic design at scale. Does Canva have any openings on the core UI or Design System teams right now?\n\nBest,\n[Your Name]",
        hook_used: "Config 2025 talk"
      }
    },
    {
      id: "c2",
      name: "Marcus Thorne",
      title: "Senior Lead Engineer",
      company: "Canva",
      email: "mthorne@canva.com",
      confidence: "medium" as const,
      hooks: [
        {
          text: "Recently posted on LinkedIn about Canva's transition to a new micro-frontend architecture",
          source: "https://linkedin.com/posts/mthorne-canva-mfe",
          type: "growth"
        }
      ],
      draft: {
        id: "d2",
        subject: "Micro-frontends at Canva",
        body: "Hi Marcus,\n\nI saw your post about the micro-frontend transition at Canva. The trade-offs you mentioned regarding shared state vs. bundle size were really insightful.\n\nI'm a Junior developer with experience in module federation and I've been following Canva's engineering blog for a while. Would love to know if your team is currently looking for junior talent to help with this transition.\n\nCheers,\n[Your Name]",
        hook_used: "LinkedIn MFE post"
      }
    },
    {
      id: "c3",
      name: "Elena Rodriguez",
      title: "Tech Lead",
      company: "Canva",
      email: "elena.r@canva.com",
      confidence: "high" as const,
      hooks: [
        {
          text: "Open-sourced a new React hook library for accessible drag-and-drop",
          source: "https://github.com/elena-rodriguez/canva-dnd",
          type: "blog"
        }
      ],
      draft: {
        id: "d3",
        subject: "Accessible DnD library — Great work",
        body: "Hi Elena,\n\nI just came across your canva-dnd library on GitHub. The way you handled keyboard navigation for nested lists is the best implementation I've seen yet.\n\nI'm a Junior Engineer looking for roles where I can contribute to accessible high-performance tools. Does your team have any upcoming openings for Frontend-focused developers?\n\nThanks,\n[Your Name]",
        hook_used: "Open source DnD library"
      }
    }
  ]
};

export default function SearchResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/pipeline/results/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          // Fallback to mock data for demo
          setData(MOCK_RESULTS);
        }
      } catch (err) {
        setData(MOCK_RESULTS);
      } finally {
        setIsLoading(false);
      }
    }
    fetchResults();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-border/20 rounded" />
        <div className="space-y-4">
          <div className="h-64 bg-border/10 rounded-xl" />
          <div className="h-64 bg-border/10 rounded-xl" />
          <div className="h-64 bg-border/10 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-6">
        <nav className="flex items-center gap-2 text-xs font-mono font-bold text-text-muted uppercase tracking-widest">
          <Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-text-primary">{data.company}</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif font-semibold text-text-primary">
              {data.company} <span className="text-text-muted mx-2">·</span> <span className="italic-accent">{data.role}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-body">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                {data.contacts.length} contacts found
              </span>
              <span className="text-text-muted">Searched moments ago</span>
              <span className="bg-success-bg text-success text-[10px] px-2 py-0.5 rounded border border-success/20 font-bold uppercase tracking-widest">
                Complete
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-6">
        {data.contacts.map((contact: any) => (
          <ContactCard 
            key={contact.id} 
            contact={contact} 
            onUpdateDraft={(id, s, b) => toast.success("Draft updated")}
            onRegenerateDraft={(id) => toast.loading("Regenerating...")}
          />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="pt-10 border-t border-border-card text-center">
        <p className="text-text-muted text-sm mb-6">
          Not finding what you need? Refine your search parameters.
        </p>
        <Link href="/search">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to New Search
          </Button>
        </Link>
      </div>
    </div>
  );
}
