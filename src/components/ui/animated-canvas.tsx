"use client";

import { useEffect, useRef } from "react";

// Easing functions
const ease = {
  quint: {
    in: (t: number, b: number, c: number, d: number): number => {
      t /= d;
      return c * t * t * t * t * t + b;
    },
    out: (t: number, b: number, c: number, d: number): number => {
      t = t / d - 1;
      return c * (t * t * t * t * t + 1) + b;
    },
  },
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

interface AnimatedCanvasProps {
  count?: number;
  lineColor?: string;
  heightMultiplier?: number;
  speed?: number;
  lineWidth?: number;
  className?: string;
  direction?: "left-to-right" | "right-to-left";
}

const AnimatedCanvas = ({
  count = 40,
  lineColor = "hsl(180, 70%, 50%)",
  heightMultiplier = 0.4,
  speed = 0.0001,
  lineWidth = 1,
  className = "",
  direction = "left-to-right",
}: AnimatedCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    };

    let visible = false;

    const draw = () => {
      if (!visible) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      const c = 1 / count;
      const time_ = Date.now() * speed;

      for (let i = 0; i < count; i++) {
        const t_ = i * c;
        const time = (time_ + t_) % 1;
        const t = ease.quint.in(time, 0, 1, 1);
        const ty = ease.quint.out(t, 0, 1, 1);
        const x =
          direction === "left-to-right"
            ? lerp(canvas.width, 0, t)
            : lerp(0, canvas.width, t);
        const y = ty * canvas.height * heightMultiplier;
        line(x, y, x, canvas.height - y);
      }

      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    // Only animate while on screen — this canvas sits in the final CTA,
    // so it would otherwise burn a rAF loop for the whole page visit.
    const observer = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && !wasVisible) draw();
      if (!visible) cancelAnimationFrame(animationRef.current);
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [count, lineColor, heightMultiplier, speed, lineWidth, direction]);

  return (
    <canvas ref={canvasRef} className={className} style={{ display: "block" }} />
  );
};

export { AnimatedCanvas };
