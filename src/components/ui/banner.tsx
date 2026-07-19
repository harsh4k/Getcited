"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  useEffect,
  useState,
} from "react";
import { X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BannerVariant = "rainbow" | "normal";

export function Banner({
  id,
  xColor,
  variant = "normal",
  changeLayout = true,
  height = "3rem",
  rainbowColors = [
    "rgba(0,149,255,0.56)",
    "rgba(231,77,255,0.77)",
    "rgba(255,0,0,0.73)",
    "rgba(131,255,166,0.66)",
  ],
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /**
   * @defaultValue 3rem
   */
  height?: string;

  xColor?: string;

  /**
   * @defaultValue 'normal'
   */
  variant?: BannerVariant;

  /**
   * For rainbow variant only, customise the colors
   */
  rainbowColors?: string[];

  /**
   * Reserve space for the banner via --banner-height so fixed nav stays visible.
   *
   * @defaultValue true
   */
  changeLayout?: boolean;
}) {
  // null = not yet checked (client-only); avoids SSR/localStorage hydration mismatch
  const [open, setOpen] = useState<boolean | null>(null);
  const globalKey = id ? `nd-banner-${id}` : null;

  useEffect(() => {
    if (!globalKey) {
      setOpen(true);
      return;
    }
    setOpen(localStorage.getItem(globalKey) !== "true");
  }, [globalKey]);

  useEffect(() => {
    if (!changeLayout || open !== true) {
      if (open === false) {
        document.documentElement.style.removeProperty("--banner-height");
      }
      return;
    }

    const root = document.documentElement;
    root.style.setProperty("--banner-height", height);

    return () => {
      root.style.removeProperty("--banner-height");
    };
  }, [changeLayout, height, open]);

  // Wait until client has read dismiss state — keeps server/client HTML in sync
  if (open !== true) return null;

  return (
    <div
      id={id}
      {...props}
      className={cn(
        "sticky top-0 z-[60] flex flex-row items-center justify-center px-4 text-center text-sm font-medium text-text-primary",
        variant === "normal" && "bg-bg-secondary",
        variant === "rainbow" && "bg-bg-primary",
        props.className,
      )}
      style={{ height }}
    >
      {variant === "rainbow"
        ? flow({
            colors: rainbowColors,
          })
        : null}
      {props.children}
      {id ? (
        <button
          type="button"
          aria-label="Close Banner"
          onClick={() => {
            setOpen(false);
            if (globalKey) {
              localStorage.setItem(globalKey, "true");
              document.documentElement.style.removeProperty("--banner-height");
              window.dispatchEvent(new Event("banner-status-changed"));
            }
          }}
          className={cn(
            buttonVariants({
              variant: "ghost",
              className:
                "absolute end-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/50 md:end-20",
              size: "icon",
            }),
          )}
        >
          <X color={xColor} />
        </button>
      ) : null}
    </div>
  );
}

const maskImage =
  "linear-gradient(to bottom,white,transparent), radial-gradient(circle at top center, white, transparent)";

function flow({ colors }: { colors: string[] }) {
  return (
    <>
      <div
        className="absolute inset-0 z-[-1]"
        style={
          {
            maskImage,
            maskComposite: "intersect",
            animation: "fd-moving-banner 20s linear infinite",
            backgroundImage: `repeating-linear-gradient(70deg, ${[...colors, colors[0]]
              .map((color, i) => `${color} ${(i * 50) / colors.length}%`)
              .join(", ")})`,
            backgroundSize: "200% 100%",
            filter: "saturate(2)",
          } as CSSProperties
        }
      />
      <style>
        {`@keyframes fd-moving-banner {
            from { background-position: 0% 0;  }
            to { background-position: 100% 0;  }
         }`}
      </style>
    </>
  );
}
