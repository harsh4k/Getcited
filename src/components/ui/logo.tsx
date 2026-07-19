import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 28, className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[30%] bg-accent text-white shadow-[0_2px_12px_rgba(129,140,248,0.35)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Quote size={Math.round(size * 0.5)} fill="currentColor" strokeWidth={0} />
    </span>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
  textClassName?: string;
}

export function Logo({ size = 28, className, textClassName }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className={cn("text-sm font-semibold text-text-primary", textClassName)}>
        <span className="font-bold">Get</span>
        <span className="font-light">cited</span>
      </span>
    </span>
  );
}
