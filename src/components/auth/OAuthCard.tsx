"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { supabaseBrowser } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12.02 12.02 0 0 0 0 10.76l4-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
    </svg>
  );
}

function OAuthCardInner({ heading, subheading }: { heading: string; subheading: string }) {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/audit` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
    // On success the browser navigates away to Google
  };

  return (
    <div className="liquid-glass w-full max-w-sm rounded-2xl bg-bg-primary/40 p-8 animate-blur-fade-up">
      <div className="text-center">
        <Link href="/" className="inline-block">
          <Logo size={34} textClassName="text-xl" />
        </Link>
        <h1 className="mt-5 text-lg font-semibold text-text-primary">{heading}</h1>
        <p className="mt-1 text-sm text-text-secondary">{subheading}</p>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-white py-3 text-sm font-medium text-black transition-colors hover:bg-gray-200 disabled:opacity-50"
      >
        <GoogleIcon />
        {loading ? "Redirecting..." : "Continue with Google"}
      </button>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-text-tertiary">
        We only use your Google account to sign you in.
        <br />
        No passwords stored, no spam.
      </p>
    </div>
  );
}

export function OAuthCard(props: { heading: string; subheading: string }) {
  return (
    <Suspense>
      <OAuthCardInner {...props} />
    </Suspense>
  );
}
