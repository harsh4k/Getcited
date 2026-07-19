import Link from "next/link";
import { ArrowRight, Gauge, Radar, TrendingUp } from "lucide-react";

const METADATA = [
  { icon: Radar, label: "4 AI platforms tracked" },
  { icon: Gauge, label: "GEO Score 0–100" },
  { icon: TrendingUp, label: "+23% avg citation lift" },
] as const;

export function Hero() {
  return (
    <section className="relative z-10 flex h-dvh flex-col justify-end px-4 pb-8 sm:px-6 md:px-12 md:pb-16">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end">
          <div className="flex-1">
            <div
              className="animate-blur-fade-up mb-6 flex flex-wrap items-center gap-3 font-mono text-xs text-text-secondary sm:gap-6 sm:text-sm md:mb-8"
              style={{ animationDelay: "300ms" }}
            >
              {METADATA.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
                  {label}
                </span>
              ))}
            </div>

            <h1
              className="animate-blur-fade-up mb-4 text-3xl font-normal tracking-[-0.04em] sm:text-5xl md:mb-6 md:text-6xl lg:text-7xl"
              style={{ animationDelay: "400ms" }}
            >
              Step Through. Work Smarter.
            </h1>

            <p
              className="animate-blur-fade-up mb-6 max-w-2xl text-base text-text-secondary sm:text-lg md:mb-12 md:text-xl"
              style={{ animationDelay: "500ms" }}
            >
              AI answers are eating your traffic. Getcited shows where AI
              attention lands — then fixes your content so it cites you.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/audit"
                className="animate-blur-fade-up flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-medium text-black transition-colors hover:bg-gray-200 sm:px-8 sm:py-3"
                style={{ animationDelay: "600ms" }}
              >
                Run Your First Audit
                <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="liquid-glass animate-blur-fade-up rounded-full px-6 py-2.5 font-medium sm:px-8 sm:py-3"
                style={{ animationDelay: "700ms" }}
              >
                See How It Works
              </a>
            </div>
          </div>

        </div>
    </section>
  );
}
