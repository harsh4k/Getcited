import { NeuralNoise } from "@/components/ui/neural-noise";

// Site-wide fixed backdrop: WebGL neural field + legibility scrims.
// Sections layer above it with `relative z-10` and translucent backgrounds.
export function Backdrop() {
  return (
    <>
      <NeuralNoise className="z-0" />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[1] h-40 bg-gradient-to-b from-bg-primary/70 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[1] h-[60dvh] bg-gradient-to-t from-bg-primary/90 via-bg-primary/45 to-transparent"
        aria-hidden
      />
    </>
  );
}
