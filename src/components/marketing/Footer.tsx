import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Open the tool", href: "/audit" },
  { label: "Contact", href: "mailto:hey@getcited.studio" },
] as const;

export function Footer() {
  return (
    <footer className="relative z-10 px-3 sm:px-6 md:px-10">
      <div className="liquid-glass overflow-hidden rounded-t-3xl bg-bg-primary/30">
        <div className="flex items-center gap-4 px-5 pt-8 sm:gap-6 sm:px-10">
          <span className="whitespace-nowrap text-xs text-text-secondary">
            © Copyright 2026
          </span>
          <div className="h-px flex-1 bg-border" aria-hidden />
          <span className="whitespace-nowrap text-xs text-text-secondary">
            All Rights Reserved
          </span>
        </div>

        <nav className="mt-10 flex flex-wrap justify-between gap-x-8 gap-y-3 px-5 sm:px-10">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-text-primary/90 transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Giant clipped wordmark, per ref — decorative only */}
        <p
          className="scroll-reveal mb-[-0.22em] mt-6 select-none whitespace-nowrap text-center text-[19vw] font-bold leading-none tracking-tighter text-text-primary"
          aria-hidden
        >
          Getcited
        </p>
      </div>
    </footer>
  );
}
