"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { BarChart3, LayoutDashboard, LogOut, Menu, Settings, UserCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function ProfileMenu({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const signOut = async () => {
    setOpen(false);
    await supabaseBrowser().auth.signOut();
    router.push("/auth/login");
  };

  if (!checked) return null;

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="absolute right-4 top-4 z-40 rounded-full bg-white px-4 py-2 text-xs font-medium text-black shadow-lg transition-colors hover:bg-gray-200"
      >
        Sign in
      </Link>
    );
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Account";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div ref={ref} className="absolute right-4 top-4 z-40 flex items-center gap-2">
      <button
        onClick={onMenuToggle}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg transition-colors hover:bg-gray-200 md:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white text-black shadow-lg transition-colors hover:bg-gray-200"
        aria-label="Profile"
        aria-expanded={open}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Google avatar, not worth the next/image remote config
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          <UserCircle size={20} />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-white/10 bg-bg-secondary/95 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-medium text-text-primary">{name}</p>
            <p className="truncate text-[11px] text-text-tertiary">{user.email}</p>
          </div>
          <div className="py-1">
            {[
              { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
              { href: "/settings", icon: Settings, label: "Settings" },
              { href: "/billing", icon: BarChart3, label: "Usage & Billing" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
                onClick={() => setOpen(false)}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
          <div className="border-t border-white/10 py-1">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
