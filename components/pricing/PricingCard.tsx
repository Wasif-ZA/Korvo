import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface PricingCardProps {
  planName: string;
  tagline: string;
  price: string;
  interval: string;
  features: string[];
  ctaText: string;
  ctaAction: () => void;
  highlighted?: boolean;
  badge?: string;
  savingsBadge?: string;
  ctaVariant?: "primary" | "secondary";
}

export function PricingCard({
  planName,
  tagline,
  price,
  interval,
  features,
  ctaText,
  ctaAction,
  highlighted = false,
  badge,
  savingsBadge,
  ctaVariant = "primary",
}: PricingCardProps) {
  return (
    <Card highlighted={highlighted} className="relative flex flex-col">
      {/* "Most popular" badge */}
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
          {badge}
        </span>
      )}

      {/* Plan name + tagline */}
      <div className="mb-4">
        <h3 className="text-2xl font-semibold text-[#1C1C1A]">{planName}</h3>
        <p className="text-sm text-gray-500 mt-1">{tagline}</p>
      </div>

      {/* Price */}
      <div className="flex items-end gap-2 mb-6">
        <span className="text-5xl font-semibold text-[#1C1C1A] leading-none">{price}</span>
        <span className="text-base text-gray-500 mb-1">{interval}</span>
        {savingsBadge && (
          <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full mb-1">
            {savingsBadge}
          </span>
        )}
      </div>

      {/* Features list */}
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-teal-600 shrink-0" aria-hidden="true" />
            <span className="text-sm text-gray-500">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant={ctaVariant}
        size="lg"
        className="w-full"
        onClick={ctaAction}
      >
        {ctaText}
      </Button>
    </Card>
  );
}
