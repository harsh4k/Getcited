import { AnimatedFolder } from "@/components/ui/3d-folder";

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=320&h=400&fit=crop&q=80`;

const STEPS = [
  {
    title: "Monitor",
    projects: [
      { id: "m1", image: unsplash("photo-1573164713988-8665fc963095"), title: "Citation dashboard" },
      { id: "m2", image: unsplash("photo-1451187580459-43490279c0fa"), title: "Visibility tracking" },
      { id: "m3", image: unsplash("photo-1526374965328-7f61d4dc18c5"), title: "Prompt watchlist" },
    ],
  },
  {
    title: "Fix",
    projects: [
      { id: "f1", image: unsplash("photo-1555949963-aa79dcee981c"), title: "AI content rewrites" },
      { id: "f2", image: unsplash("photo-1487058792275-0ad4aaf24ca7"), title: "Schema injection" },
      { id: "f3", image: unsplash("photo-1558494949-ef010cbdcc31"), title: "Crawlability fixes" },
    ],
  },
  {
    title: "Prove",
    projects: [
      { id: "p1", image: unsplash("photo-1531297484001-80022131f5a1"), title: "Citation lift report" },
      { id: "p2", image: unsplash("photo-1518770660439-4636190af475"), title: "Revenue attribution" },
      { id: "p3", image: unsplash("photo-1550751827-4bd374c3f58b"), title: "Before / after score" },
    ],
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-10 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12">
        <div className="scroll-reveal">
          <p className="mb-4 font-mono text-xs tracking-widest text-accent">
            monitor → fix → prove
          </p>
          <h2 className="max-w-3xl text-3xl font-normal tracking-[-0.03em] sm:text-4xl md:text-5xl">
            Everyone tells you what&apos;s wrong. We fix it.
          </h2>
          <p className="mt-5 max-w-2xl text-base text-text-secondary sm:text-lg">
            One loop, not another report. Getcited watches every AI platform,
            rewrites what holds you back, and proves the lift in citations —
            open a folder to see what ships.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
          {STEPS.map((step) => (
            <AnimatedFolder
              key={step.title}
              title={step.title}
              projects={[...step.projects]}
              className="scroll-reveal bg-bg-secondary/25 backdrop-blur-md"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
