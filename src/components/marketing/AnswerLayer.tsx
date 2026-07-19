"use client";

import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-80px" },
};

const SOURCES = [
  { domain: "yoursite.com", cited: true },
  { domain: "competitor-a.com", cited: false },
  { domain: "competitor-b.io", cited: false },
] as const;

export function AnswerLayer() {
  return (
    <section id="product" className="relative z-10 py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 md:grid-cols-2 md:px-12">
        <div>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-4 font-mono text-xs tracking-widest text-accent"
          >
            the answer layer
          </motion.p>
          <motion.h2
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
            className="text-3xl font-normal tracking-[-0.03em] sm:text-4xl md:text-5xl"
          >
            Your buyers ask AI first.
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.16 }}
            className="mt-5 max-w-xl text-base text-text-secondary sm:text-lg"
          >
            ChatGPT, Gemini, Copilot, and Perplexity now answer the questions
            your homepage used to. If your pages aren&apos;t cited in the
            answer, you were never in the running.
          </motion.p>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.24 }}
            className="mt-8 font-mono text-sm text-text-secondary"
          >
            60% of searches already end without a click.
          </motion.p>
          <motion.a
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.32 }}
            href="#how-it-works"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            See how citations are scored
            <ArrowRight size={16} />
          </motion.a>
        </div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          className="relative"
        >
          <div
            className="absolute -inset-8 rounded-3xl opacity-25 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 60% 40%, var(--accent), transparent 70%)",
            }}
            aria-hidden
          />

          <div className="liquid-glass relative rounded-2xl bg-bg-primary/25 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <span className="font-mono text-xs text-text-tertiary">
                ai-answer.log
              </span>
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-text-tertiary/40" />
                <span className="h-2 w-2 rounded-full bg-text-tertiary/40" />
                <span className="h-2 w-2 rounded-full bg-accent" />
              </span>
            </div>

            <p className="mb-4 w-fit rounded-full bg-bg-tertiary/80 px-4 py-2 text-sm text-text-primary">
              best analytics tool for a small agency?
            </p>

            <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
              For small agencies, the strongest option is the platform behind{" "}
              <span className="rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent">
                yoursite.com
              </span>{" "}
              — setup takes under a day, and pricing scales per seat. Two
              alternatives are worth a look, but neither publishes comparable
              onboarding data.
            </p>

            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-3 font-mono text-xs text-text-tertiary">
                sources
              </p>
              <ul className="flex flex-wrap gap-2">
                {SOURCES.map((source) => (
                  <li
                    key={source.domain}
                    className={
                      source.cited
                        ? "flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 font-mono text-xs text-accent"
                        : "flex items-center gap-1.5 rounded-full bg-bg-tertiary/60 px-3 py-1.5 font-mono text-xs text-text-tertiary"
                    }
                  >
                    {source.cited && <Check size={12} strokeWidth={2.5} />}
                    {source.domain}
                    {source.cited && <span aria-hidden>· #1</span>}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 font-mono text-xs text-text-tertiary">
              getcited tracks 1,400+ prompts like this — daily.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
