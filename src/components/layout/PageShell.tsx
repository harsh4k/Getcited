import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="relative z-10 mx-auto min-h-dvh w-full max-w-4xl px-6 py-8">
      <header className="flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <Link
          href="/audit"
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs text-text-secondary backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-text-primary"
        >
          <ArrowLeft size={13} />
          Back to tool
        </Link>
      </header>
      <div className="animate-blur-fade-up mt-12">
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
