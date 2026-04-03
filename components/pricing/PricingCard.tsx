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
    <Card highlighted={highlighted} className={highlighted ? "bg-white" : ""}>
      {/* Popular badge */}
      {badge && (
        <div className="mb-4">
          <span className="bg-accent text-white text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider">
            {badge}
          </span>
        </div>
      )}

      {/* Plan info */}
      <div className="mb-4">
        <h3 className="text-2xl font-semibold text-text-primary">{planName}</h3>
        <p className="text-sm text-gray-500 mt-1">{tagline}</p>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-semibold text-text-primary">{price}</span>
        <span className="text-sm text-gray-500">{interval}</span>
        {savingsBadge && (
          <span className="ml-2 bg-accent/10 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">
            {savingsBadge}
          </span>
        )}
      </div>

      {/* Feature list */}
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="text-gray-500 text-lg leading-none mt-1">—</span>
            <span className="text-base text-gray-500 font-normal">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant={highlighted ? "primary" : "secondary"}
        className="w-full"
        onClick={ctaAction}
      >
        {ctaText}
      </Button>
    </Card>
  );
}
