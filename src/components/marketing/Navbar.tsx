"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, User, X } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Audit", href: "/audit" },
] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    // rAF instead of a sync call: covers landing mid-page via #anchor
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 z-50 transition-all duration-300",
        scrolled ? "top-2 sm:top-4" : "top-0"
      )}
    >
      <nav
        className={cn(
          "relative flex items-center justify-between transition-all duration-300",
          scrolled
            ? "px-3 sm:px-6 md:px-10"
            : "px-4 py-4 sm:px-6 md:px-12 md:py-6"
        )}
      >
        {/* Left: wordmark at top of page, availability pill once scrolled */}
        {scrolled ? (
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="hidden text-xs font-medium text-black sm:block">
              available for beta
            </span>
          </div>
        ) : (
          <Link
            href="/"
            className="animate-blur-fade-up text-xl md:text-2xl"
            style={{ animationDelay: "0ms" }}
          >
            <span className="font-bold">Get</span>
            <span className="font-light">cited</span>
          </Link>
        )}

        {/* Center: nav links; scrolled wraps them in a white pill with a logo chip.
            Absolutely positioned — justify-between would push it off true center
            because the left/right groups have different widths. */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center transition-all duration-300 lg:flex",
            scrolled
              ? "gap-6 rounded-full bg-white py-1.5 pl-2 pr-6 shadow-lg"
              : "gap-8"
          )}
        >
          {scrolled && (
            <Link
              href="/"
              aria-label="Getcited home"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white"
            >
              G
            </Link>
          )}
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "animate-blur-fade-up text-sm transition-colors",
                scrolled
                  ? "font-medium text-black hover:opacity-60"
                  : "hover:text-text-secondary"
              )}
              style={{ animationDelay: `${100 + i * 50}ms` }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: sign-in + primary Run Audit CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className={cn(
              "animate-blur-fade-up hidden rounded-full px-4 py-2 text-sm font-medium sm:block md:px-6",
              scrolled
                ? "bg-white py-2.5 text-black shadow-lg transition-colors hover:bg-gray-200"
                : "liquid-glass"
            )}
            style={{ animationDelay: "350ms" }}
          >
            Sign in
          </Link>
          <Link
            href="/audit"
            className={cn(
              "animate-blur-fade-up hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium sm:flex md:px-6",
              scrolled
                ? "bg-black py-2.5 text-white shadow-lg transition-colors hover:bg-neutral-800"
                : "bg-white text-black transition-colors hover:bg-gray-200"
            )}
            style={{ animationDelay: "400ms" }}
          >
            Run Audit
            <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "animate-blur-fade-up relative flex h-10 w-10 items-center justify-center rounded-full lg:hidden",
              scrolled ? "bg-white text-black shadow-lg" : "liquid-glass"
            )}
            style={{ animationDelay: "350ms" }}
          >
            <Menu
              size={18}
              className={`transition-all duration-500 ease-out ${
                menuOpen ? "rotate-180 scale-50 opacity-0" : "opacity-100"
              }`}
            />
            <X
              size={18}
              className={`absolute transition-all duration-500 ease-out ${
                menuOpen ? "opacity-100" : "-rotate-180 scale-50 opacity-0"
              }`}
            />
          </button>
        </div>
      </nav>

      <div
        className={`absolute inset-x-0 top-[72px] z-40 border-y border-border bg-bg-secondary/95 shadow-2xl backdrop-blur-lg transition-all duration-500 ease-out lg:hidden ${
          menuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col px-4 py-4 sm:px-6">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-3 py-3 transition-all duration-500 ease-out hover:bg-bg-hover ${
                menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4 sm:hidden">
            <Link
              href="/audit"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black"
            >
              Run Audit
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="liquid-glass flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium"
            >
              <User size={16} />
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
