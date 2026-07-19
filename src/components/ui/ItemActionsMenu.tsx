"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface ItemActionsMenuProps {
  onRename: () => void;
  onDelete: () => void;
  className?: string;
  /** Lighter icon when the parent row is selected (white bg). */
  tone?: "default" | "onLight";
}

export function ItemActionsMenu({
  onRename,
  onDelete,
  className,
  tone = "default",
}: ItemActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
          tone === "onLight"
            ? "text-black/50 hover:bg-black/10 hover:text-black"
            : "text-text-tertiary hover:bg-white/10 hover:text-text-primary"
        )}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-50 min-w-[9.5rem] overflow-hidden rounded-xl border border-white/10 bg-bg-secondary/95 py-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onRename();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <Pencil size={13} />
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
