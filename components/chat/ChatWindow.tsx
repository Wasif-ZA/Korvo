"use client";

import { ReactNode, useRef, useEffect } from "react";

interface ChatWindowProps {
  children: ReactNode;
  input: ReactNode;
}

export function ChatWindow({ children, input }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto">{children}</div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-surface/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto">{input}</div>
      </div>
    </div>
  );
}
