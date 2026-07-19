import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { AnimatedCanvas } from "@/components/ui/animated-canvas";

export function FinalCta() {
  return (
    <section id="waitlist" className="relative z-10 overflow-hidden py-28 md:py-40">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
      >
        <AnimatedCanvas
          count={45}
          lineColor="rgba(129, 140, 248, 0.28)"
          heightMultiplier={0.38}
          speed={0.00002}
          lineWidth={1.5}
          className="h-full w-full"
          direction="right-to-left"
        />
      </div>

      <div className="scroll-reveal relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-normal tracking-[-0.03em] sm:text-5xl md:text-6xl">
          Every site deserves{" "}
          <span className="inline-block h-[0.82em] w-[1.7em] overflow-hidden rounded-xl align-middle">
            <Image
              src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=340&h=164&fit=crop&q=80"
              alt=""
              width={170}
              height={82}
              className="h-full w-full object-cover"
            />
          </span>{" "}
          to be cited.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-text-secondary sm:text-lg">
          Join the beta and run your first audit before your competitors learn
          what GEO stands for.
        </p>

        <form
          className="liquid-glass mx-auto mt-10 flex max-w-md items-center gap-2 rounded-full p-1.5"
          action="/auth/login"
        >
          <input
            type="email"
            required
            placeholder="Enter your email"
            aria-label="Email address"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            type="submit"
            className="flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gray-200"
          >
            Join the beta
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-4 font-mono text-xs text-text-tertiary">
          no card · 2-minute setup · cancel anytime
        </p>
      </div>
    </section>
  );
}
