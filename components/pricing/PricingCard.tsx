import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
}: PricingCardProps) {
  return (
    <Card highlighted={highlighted} className="relative flex flex-col h-full">
      {/* Popular badge */}
      {badge && (
        <span className="absolute -top-3 left-8 bg-teal-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
          {badge}
        </span>
      )}

      {/* Plan info */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-[#1C1C1A] tracking-tight mb-2">{planName}</h3>
        <p className="text-sm text-[#6B6B68] leading-relaxed">{tagline}</p>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-10">
        <span className="text-5xl font-semibold text-[#1C1C1A] tracking-tight">{price}</span>
        <span className="text-[#9B9B98] font-medium">{interval}</span>
        {savingsBadge && (
          <span className="ml-2 bg-teal-50 text-teal-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-teal-200">
            {savingsBadge}
          </span>
        )}
      </div>

      {/* Features list */}
      <ul className="flex flex-col gap-4 mb-12 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="text-teal-600 text-sm leading-none mt-1">&#10003;</span>
            <span className="text-sm text-[#6B6B68] leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant={highlighted ? "primary" : "secondary"}
        size="lg"
        className="w-full"
        onClick={ctaAction}
      >
        {ctaText}
      </Button>
    </Card>
  );
}
