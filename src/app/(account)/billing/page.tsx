"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Globe, Sparkles, Zap } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { api, type AuditSummary } from "@/lib/api";

const INCLUDED = [
  "Unlimited GEO audits",
  "Site crawling & content extraction",
  "AI citation questions & query analysis",
  "Ad attention heatmaps",
  "A/B testing SDK",
];

export default function BillingPage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      void api
        .listAudits()
        .then((data) => setAudits(data.audits))
        .catch(() => setAudits([]));
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  const usage = [
    { icon: Sparkles, label: "Audits run", value: audits.length },
    {
      icon: Globe,
      label: "Pages crawled",
      value: audits.reduce((s, h) => s + h.active_page_count, 0),
    },
    {
      icon: Zap,
      label: "Pages optimized",
      value: audits.reduce((s, h) => s + h.aeo_count, 0),
    },
  ];

  return (
    <PageShell title="Usage & Billing" subtitle="Your plan and what you've used.">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Current plan</h2>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-medium text-accent">
              Free · Beta
            </span>
          </div>
          <p className="mt-3 font-mono text-3xl text-text-primary">
            $0<span className="text-sm text-text-tertiary">/month</span>
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            Everything is free while Getcited is in beta. Paid plans land after launch.
          </p>
          <ul className="mt-5 space-y-2.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-text-secondary">
                <BadgeCheck size={14} className="shrink-0 text-green-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          {usage.map((u) => (
            <div key={u.label} className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
                <u.icon size={14} className="text-accent" />
                {u.label}
              </div>
              <div className="mt-2 font-mono text-2xl text-text-primary">{u.value}</div>
            </div>
          ))}
          <p className="px-1 text-[11px] leading-relaxed text-text-tertiary">
            Usage is counted from audits saved to your account. No payment method required.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
