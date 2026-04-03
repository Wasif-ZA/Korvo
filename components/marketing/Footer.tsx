"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-background pt-16 pb-8 overflow-hidden border-t border-border mt-12">
      {/* Background Dots */}
      <div className="absolute inset-0 dot-matrix pointer-events-none z-0" />

      {/* Engineering Noise */}
      <div className="absolute top-8 right-8 text-[8px] font-mono opacity-30 text-text-muted select-none leading-tight uppercase">
        FOOTER_MOD_LOADED<br />
        SYS_VER_2.0.4<br />
        ALL_NODES_ACTIVE
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-16">
          <div className="max-w-lg">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary mb-3 tracking-tight">KORVO_</h2>
            <p className="text-text-secondary text-[14px] leading-relaxed font-mono opacity-80 uppercase tracking-wider">
              Precision engineering for job outreach. We find the decision makers, analyze multiple data sources, and draft tone-calibrated communications.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-2">
            {[
              { label: "Book a Demo", href: "#" },
              { label: "Documentation", href: "#" },
              { label: "System Status", href: "#" },
            ].map((btn) => (
              <a 
                key={btn.label}
                href={btn.href}
                className="bg-white text-text-primary text-[11.5px] font-mono font-bold px-5 py-2.5 border border-border hover:border-accent/50 hover:text-accent transition-colors flex items-center gap-2 uppercase tracking-widest shadow-sm"
              >
                {btn.label}
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </a>
            ))}
          </div>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-border mb-12" />

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 mb-20">
          <div>
            <h3 className="text-text-primary font-mono uppercase tracking-[0.2em] text-[10px] mb-5 font-bold flex items-center gap-3">
              <span className="w-2 h-2 bg-accent" />
              PIPELINE
            </h3>
            <ul className="space-y-3">
              {["Features", "Data Sources", "Architecture", "Pricing"].map(link => (
                <li key={link}><Link href="#" className="text-text-muted text-[13px] font-mono hover:text-accent transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-text-primary font-mono uppercase tracking-[0.2em] text-[10px] mb-5 font-bold flex items-center gap-3">
              <span className="w-2 h-2 bg-border" />
              USE_CASES
            </h3>
            <ul className="space-y-3">
              {["Software Engineers", "Sales Professionals", "Founders", "Marketing"].map(link => (
                <li key={link}><Link href="#" className="text-text-muted text-[13px] font-mono hover:text-accent transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-text-primary font-mono uppercase tracking-[0.2em] text-[10px] mb-5 font-bold flex items-center gap-3">
              <span className="w-2 h-2 bg-border" />
              RESOURCES
            </h3>
            <ul className="space-y-3">
              {["API Documentation", "Outreach Templates", "Changelog", "Case Studies"].map(link => (
                <li key={link}><Link href="#" className="text-text-muted text-[13px] font-mono hover:text-accent transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-text-primary font-mono uppercase tracking-[0.2em] text-[10px] mb-5 font-bold flex items-center gap-3">
              <span className="w-2 h-2 bg-border" />
              SYSTEM
            </h3>
            <ul className="space-y-3">
              {["About Us", "Careers", "Contact Support", "Terms & Privacy"].map(link => (
                <li key={link}><Link href="#" className="text-text-muted text-[13px] font-mono hover:text-accent transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section Divider */}
        <div className="w-full h-px bg-border mb-6 z-20 relative" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-20">
          <p className="text-text-muted font-mono text-[10px] uppercase tracking-[0.2em]">
            © 2026 KORVO SYSTEMS. All rights reserved.
          </p>

          <div className="flex items-center gap-6 relative">
            <span className="text-text-muted font-mono text-[10px] uppercase tracking-[0.2em] hidden md:inline-block">
              LATENCY: 14ms
            </span>
            
            <div className="bg-white px-3 py-1.5 flex items-center gap-2 border border-border shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-[9px] text-text-primary font-mono uppercase tracking-[0.2em] font-bold">
                Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Giant Background Text */}
      <div className="absolute bottom-[-5%] left-0 right-0 overflow-hidden pointer-events-none flex justify-center z-0 opacity-[0.03] select-none">
        <span className="text-text-primary font-serif font-bold text-[16vw] leading-none whitespace-nowrap tracking-tighter">
          KORVO
        </span>
      </div>
    </footer>
  );
}
