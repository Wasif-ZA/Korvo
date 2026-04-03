import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/utils";
import { PricingCard } from "@/components/pricing/PricingCard";

describe("Contact card equivalent (PricingCard)", () => {
  it("renders plan title, key features, and CTA button", () => {
    render(
      <PricingCard
        planName="Pro"
        tagline="For serious outreach"
        price="AUD $19"
        interval="/month"
        features={["50 searches per month", "Unlimited email drafts"]}
        ctaText="Start Pro"
        ctaAction={vi.fn()}
        highlighted
      />,
    );

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("50 searches per month")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Pro" })).toBeInTheDocument();
  });
});
