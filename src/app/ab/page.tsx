"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ProfileMenu } from "@/components/audit/ProfileMenu";
import { AbTestingPanel } from "@/components/audit/AbTestingPanel";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { api, normalizeSiteUrl, type SiteData } from "@/lib/api";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  Plus,
  Search,
  Zap,
} from "lucide-react";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent/40";

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol).toString();
}

export default function AbPage() {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const loadSites = useCallback(async () => {
    setError(null);
    try {
      const data = await api.listSites();
      setSites(data.sites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load site profiles");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  const openCreate = () => {
    setShowCreate(true);
    setActiveSiteId(null);
    setError(null);
    setName("");
    setUrl("");
  };

  const onCreateProfile = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const normalized = normalizeSiteUrl(normalizeUrl(url));
      const profileName = name.trim() || new URL(normalized).hostname;
      const existing = sites.find((s) => normalizeSiteUrl(s.url) === normalized);
      if (existing) {
        setActiveSiteId(existing.id);
        setShowCreate(false);
        return;
      }
      const site = await api.createSite(profileName, normalized);
      setSites((prev) => [site, ...prev]);
      setActiveSiteId(site.id);
      setShowCreate(false);
      setName("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create profile");
    } finally {
      setCreating(false);
    }
  };

  const showingDetail = activeSiteId != null && !showCreate;
  const showingHome = !showingDetail;

  const toolsNav = (closeMobile?: boolean) => (
    <nav className="space-y-0.5 px-3 pt-2">
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">Tools</div>
      <Link
        href="/audit"
        onClick={() => {
          if (closeMobile) setMobileMenuOpen(false);
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
      >
        <Search size={14} className="text-accent" />
        Analysis
      </Link>
      <button
        type="button"
        onClick={() => {
          if (closeMobile) setMobileMenuOpen(false);
          setShowCreate(false);
          setActiveSiteId(null);
        }}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors",
          showingHome ? "bg-white text-black" : "text-text-secondary hover:bg-white/10 hover:text-text-primary"
        )}
      >
        <Zap size={14} className="text-accent" />
        A/B Test
      </button>
    </nav>
  );

  const profilesList = (onSelect?: () => void) => (
    <div className="flex flex-1 flex-col overflow-hidden px-3 pt-4">
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
        Site profiles
      </div>
      <div className="custom-scrollbar mt-1 space-y-0.5 overflow-y-auto">
        {sites.length === 0 && !loadingList && (
          <p className="px-3 py-6 text-center text-[11px] leading-relaxed text-text-tertiary">
            No profiles yet —
            <br />
            create one to get an SDK
          </p>
        )}
        {sites.map((site) => (
          <button
            key={site.id}
            type="button"
            onClick={() => {
              setActiveSiteId(site.id);
              setShowCreate(false);
              onSelect?.();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
              activeSiteId === site.id && !showCreate
                ? "bg-white text-black"
                : "text-text-secondary hover:bg-white/10 hover:text-text-primary"
            )}
          >
            <Globe size={14} className="shrink-0 text-accent" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium">{site.name}</span>
              <span className="block truncate font-mono text-[10px] opacity-70">
                {site.url.replace(/^https?:\/\//, "")}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative z-10 h-dvh overflow-hidden text-text-primary">
      <ProfileMenu onMenuToggle={() => setMobileMenuOpen((v) => !v)} />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={cn(
          "liquid-glass absolute bottom-3 left-3 top-3 z-50 hidden w-56 flex-col rounded-2xl bg-bg-primary/40 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:flex",
          sidebarCollapsed ? "pointer-events-none -translate-x-[115%] opacity-0" : "translate-x-0 opacity-100"
        )}
        aria-hidden={sidebarCollapsed}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <LogoMark size={26} />
            <span>
              <span className="font-bold">Get</span>
              <span className="font-light">cited</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <div className="px-3 pb-1 pt-2">
          <button
            type="button"
            onClick={openCreate}
            className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-text-secondary">
              +
            </span>
            New profile
          </button>
        </div>

        {toolsNav()}
        {profilesList()}
      </aside>

      <aside
        className={cn(
          "liquid-glass fixed inset-y-0 left-0 z-50 flex w-56 flex-col rounded-r-2xl bg-bg-primary/95 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden",
          mobileMenuOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-full opacity-0"
        )}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <LogoMark size={26} />
            <span>
              <span className="font-bold">Get</span>
              <span className="font-light">cited</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label="Close menu"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
        <div className="px-3 pb-1 pt-2">
          <button
            type="button"
            onClick={() => {
              openCreate();
              setMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-text-secondary">
              +
            </span>
            New profile
          </button>
        </div>
        {toolsNav(true)}
        {profilesList(() => setMobileMenuOpen(false))}
      </aside>

      {sidebarCollapsed && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="liquid-glass absolute left-4 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg-primary/35 text-text-secondary shadow-lg transition-all animate-in fade-in slide-in-from-left-2 duration-300 hover:text-text-primary md:flex"
          aria-label="Show sidebar"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <main
        className={cn(
          "flex h-full flex-col overflow-hidden transition-[padding] duration-300",
          !sidebarCollapsed && "md:pl-[248px]"
        )}
      >
        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-10">
          <div className="mx-auto w-full max-w-5xl">
            {error && showingHome && (
              <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            {showingDetail && activeSiteId != null && (
              <AbTestingPanel
                siteId={activeSiteId}
                onBack={() => {
                  setActiveSiteId(null);
                  void loadSites();
                }}
              />
            )}

            {showingHome && (
              <>
                <div className="mb-8">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Multi-site A/B · unique SDK per profile
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Site <span className="text-accent">profiles</span>
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-white/75">
                    Create a profile with a name and URL. We issue an SDK for that site. Paste it once —
                    live traffic is stored in the database and shown here, with AI suggestions from your
                    insights.
                  </p>
                </div>

                {(showCreate || sites.length === 0) && (
                  <form
                    onSubmit={(e) => void onCreateProfile(e)}
                    className="liquid-glass mb-6 rounded-2xl bg-bg-primary/25 p-5"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Plus size={16} className="text-accent" /> Create new profile
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      Name + site link → unique SDK keyed to your account.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block text-[11px] text-text-secondary">
                        <span className="mb-1.5 block">Profile name</span>
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Marketing site"
                          className={fieldClass}
                        />
                      </label>
                      <label className="block text-[11px] text-text-secondary">
                        <span className="mb-1.5 block">Site URL</span>
                        <input
                          required
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://yoursite.com"
                          className={fieldClass}
                        />
                      </label>
                    </div>
                    {error && showCreate && (
                      <p className="mt-3 flex items-center gap-2 text-xs text-red-300">
                        <AlertCircle size={12} /> {error}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={creating}
                        className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg-primary transition hover:brightness-110 disabled:opacity-50"
                      >
                        {creating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        Generate SDK
                      </button>
                      {sites.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreate(false);
                            setError(null);
                          }}
                          className="rounded-xl bg-white/10 px-4 py-2 text-xs text-text-secondary hover:bg-white/15"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {!showCreate && sites.length > 0 && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                  >
                    <Plus size={16} className="text-accent" /> Add another site profile
                  </button>
                )}

                {loadingList ? (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Loader2 size={16} className="animate-spin text-accent" /> Loading profiles…
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sites.map((site) => (
                      <button
                        key={site.id}
                        type="button"
                        onClick={() => {
                          setActiveSiteId(site.id);
                          setShowCreate(false);
                        }}
                        className="liquid-glass rounded-2xl bg-bg-primary/25 p-5 text-left transition hover:bg-bg-primary/35"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-text-primary">{site.name}</div>
                            <div className="mt-1 truncate font-mono text-[11px] text-text-secondary">
                              {site.url}
                            </div>
                          </div>
                          <Globe size={16} className="shrink-0 text-accent" />
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <code className="truncate font-mono text-[10px] text-text-tertiary">{site.sdk_key}</code>
                          <span className="shrink-0 text-[11px] text-accent">Open →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
