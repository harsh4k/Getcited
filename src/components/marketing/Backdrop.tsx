const VIDEO_SRC = "/hero/moon-walk.mp4";
const POSTER_SRC = "/hero/moon-walk.jpg";

// Site-wide fixed backdrop: video + bottom blur + legibility scrims.
// Sections layer above it with `relative z-10` and translucent backgrounds.
export function Backdrop() {
  return (
    <>
      <video
        className="fixed inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
      <div className="hero-bottom-blur z-[1]" aria-hidden />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[2] h-40 bg-gradient-to-b from-bg-primary/70 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[2] h-[60dvh] bg-gradient-to-t from-bg-primary/90 via-bg-primary/45 to-transparent"
        aria-hidden
      />
    </>
  );
}
