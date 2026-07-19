"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Globe, Plus, Sparkles, Zap } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { api, type AuditSummary } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      void api
        .listAudits()
        .then((data) => setAudits(data.audits))
        .catch(() => setAudits([]));
    }, 0);
    supabaseBrowser()
      .auth.getUser()
      .then(({ data }) => {
        const n =
          (data.user?.user_metadata?.full_name as string | undefined) ||
          data.user?.email?.split("@")[0];
        setName(n ?? null);
      });
    return () => window.clearTimeout(hydrate);
  }, []);

  const sites = new Set(audits.map((h) => h.url)).size;
  const pagesCrawled = audits.reduce((sum, h) => sum + h.active_page_count, 0);
  const optimized = audits.reduce((sum, h) => sum + h.aeo_count, 0);

  const stats = [
    { icon: Sparkles, label: "Audits run", value: audits.length },
    { icon: Globe, label: "Sites analyzed", value: sites },
    { icon: BarChart3, label: "Pages crawled", value: pagesCrawled },
    { icon: Zap, label: "Pages optimized", value: optimized },
  ];

  return (
    <PageShell
      title={name ? `Welcome back, ${name}` : "Dashboard"}
      subtitle="Your AI visibility work at a glance."
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
            <s.icon size={16} className="text-accent" />
            <div className="mt-3 font-mono text-2xl text-text-primary">{s.value}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-text-tertiary">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Recent audits</h2>
        <Link
          href="/audit"
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-gray-200"
        >
          <Plus size={13} />
          New audit
        </Link>
      </div>

      {audits.length === 0 ? (
        <div className="liquid-glass mt-4 rounded-2xl bg-bg-primary/25 p-10 text-center">
          <p className="text-sm text-text-secondary">No audits yet.</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Run your first audit and it will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {audits.slice(0, 8).map((entry) => (
            <Link
              key={entry.id}
              href={`/audit?id=${entry.id}`}
              className="liquid-glass flex items-center justify-between rounded-2xl bg-bg-primary/25 px-5 py-3.5 transition-colors hover:bg-white/10"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-text-primary">
                  {(entry.name || entry.url).replace(/^https?:\/\//, "")}
                </p>
                <p className="mt-0.5 text-[11px] text-text-tertiary">
                  Analysis · {new Date(entry.refreshed_at).toLocaleString()}
                </p>
              </div>
              <span className="ml-4 shrink-0 text-[11px] text-text-tertiary">
                {entry.active_page_count > 0 && `${entry.active_page_count} pages`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
