import type { Metadata } from "next";
import { PricingPageClient } from "@/components/pricing/PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing — Korvo",
  description: "Simple pricing. Free to start. Pro when you mean business.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
