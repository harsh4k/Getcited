import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Scout",
    price: "$0",
    period: "forever",
    blurb: "See where you stand.",
    features: ["1 site", "Weekly audit", "GEO score", "Top-10 prompt tracking"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Studio",
    price: "$29",
    period: "/month",
    blurb: "Fix what AI skips.",
    features: [
      "5 sites",
      "Daily citation tracking",
      "AI content rewrites",
      "Citation alerts",
      "Revenue heatmap",
    ],
    cta: "Start Studio",
    featured: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    blurb: "Prove it to clients.",
    features: [
      "25 sites",
      "White-label reports",
      "API access",
      "Priority support",
    ],
    cta: "Talk to us",
    featured: false,
  },
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="relative z-10 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12">
        <div className="scroll-reveal">
          <p className="mb-4 font-mono text-xs tracking-widest text-accent">
            pricing
          </p>
          <h2 className="max-w-3xl text-3xl font-normal tracking-[-0.03em] sm:text-4xl md:text-5xl">
            Start free. Pay when it pays.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div key={tier.name} className="scroll-reveal relative">
              {/* badge lives outside the glass card — .liquid-glass clips overflow */}
              {tier.featured && (
                <span className="absolute -top-3 right-6 z-10 rounded-full bg-accent px-3 py-1 font-mono text-xs text-accent-fg">
                  most picked
                </span>
              )}
              <div
                className={cn(
                  "liquid-glass flex h-full flex-col rounded-2xl bg-bg-primary/30 p-6 sm:p-8",
                  tier.featured && "ring-1 ring-accent/40"
                )}
              >
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-text-secondary">{tier.blurb}</p>
              <p className="mt-6 font-mono">
                <span className="text-4xl">{tier.price}</span>
                <span className="text-sm text-text-secondary">
                  {" "}
                  {tier.period}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-text-secondary"
                  >
                    <Check size={16} className="shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/login"
                className={cn(
                  "mt-8 rounded-full px-6 py-2.5 text-center font-medium transition-colors",
                  tier.featured
                    ? "bg-white text-black hover:bg-gray-200"
                    : "liquid-glass hover:bg-bg-hover/40"
                )}
              >
                {tier.cta}
              </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
