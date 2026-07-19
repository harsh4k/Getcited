"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LogOut, ShieldCheck, Trash2, UserCircle } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { clearHistory, getHistory } from "@/lib/history";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    supabaseBrowser()
      .auth.getUser()
      .then(({ data }) => {
        setUser(data.user);
        setChecked(true);
      });
    const hydrate = window.setTimeout(() => setHistoryCount(getHistory().length), 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/auth/login");
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistoryCount(0);
    setCleared(true);
  };

  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0];
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const provider = user?.app_metadata?.provider ?? "google";

  return (
    <PageShell title="Settings" subtitle="Your account and local data.">
      {checked && !user && (
        <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-8 text-center">
          <p className="text-sm text-text-secondary">You are not signed in.</p>
          <a
            href="/auth/login"
            className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-xs font-medium text-black transition-colors hover:bg-gray-200"
          >
            Sign in
          </a>
        </div>
      )}

      {user && (
        <div className="space-y-4">
          <div className="liquid-glass flex items-center gap-4 rounded-2xl bg-bg-primary/25 p-6">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Google avatar
              <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <UserCircle size={56} className="text-text-tertiary" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
              <p className="truncate text-xs text-text-secondary">{user.email}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <ShieldCheck size={12} className="text-green-400" />
                Signed in with {provider} · joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-6">
            <h2 className="text-sm font-semibold text-text-primary">Local data</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Audit history is stored in this browser ({historyCount} {historyCount === 1 ? "entry" : "entries"}).
            </p>
            <button
              onClick={handleClearHistory}
              disabled={historyCount === 0}
              className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs text-text-secondary transition-colors hover:bg-white/15 hover:text-text-primary disabled:opacity-40"
            >
              <Trash2 size={13} />
              {cleared ? "History cleared" : "Clear audit history"}
            </button>
          </div>

          <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-6">
            <h2 className="text-sm font-semibold text-text-primary">Session</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Your account is managed through your Google account — no password to change here.
            </p>
            <button
              onClick={signOut}
              className="mt-4 flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/20"
            >
              <LogOut size={13} />
              Log out
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
