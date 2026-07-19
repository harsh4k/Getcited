"use client";

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const SPRING_TRANSITION = "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
const SMOOTH_HEIGHT_TRANSITION = "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.15s ease-out";

function MorphingText({ text }: { text: string }) {
  const [width, setWidth] = useState<number | "auto">("auto");
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      setWidth(spanRef.current.offsetWidth);
    }
  }, [text]);

  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
      style={{ width }}
    >
      <span ref={spanRef} className="invisible whitespace-nowrap px-1">
        {text}
      </span>
      <span
        key={text}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-300"
      >
        {text}
      </span>
    </span>
  );
}

function ModelIcon({ model, className }: { model: string; className?: string }) {
  const kind =
    model === "Crawl"
      ? "crawl"
      : model === "Ads"
        ? "ads"
        : model === "AB Test"
          ? "ab"
          : "spark";

  return (
    <span className={cn("inline-flex items-center justify-center text-current", className)} aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" className="size-full">
        {kind === "crawl" && (
          <>
            <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.4" />
            <path d="M2.75 8h10.5M8 2.25c1.35 1.38 2.05 3.25 2.05 5.75S9.35 12.37 8 13.75C6.65 12.37 5.95 10.5 5.95 8S6.65 3.63 8 2.25Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </>
        )}
        {kind === "ads" && (
          <>
            <path d="M3 11.75V6.5M8 11.75V3.25M13 11.75V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M2.5 13.25h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </>
        )}
        {kind === "ab" && (
          <>
            <path d="M3.25 12.5 6.1 3.5h1.55l2.85 9" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.45 9.1h4.85M11.5 3.5v9M9.95 5.05h3.1M9.95 10.95h3.1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          </>
        )}
        {kind === "spark" && (
          <>
            <path d="M8 1.75 9.45 6.2 14 8l-4.55 1.8L8 14.25 6.55 9.8 2 8l4.55-1.8L8 1.75Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
            <path d="M12.3 2.5v2.1M11.25 3.55h2.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 12V2M7 2L2.5 6.5M7 2L11.5 6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface PromptInputProps {
  onSubmit?: (value: string, meta: { model: string }) => void;
  placeholder?: string;
  className?: string;
  models?: string[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  align?: "center" | "start";
}

export const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      onSubmit,
      placeholder = "Ask anything",
      className,
      models = ["GEO Optimizer", "Crawl", "Ads", "AB Test"],
      defaultValue = "",
      value: controlledValue,
      onChange,
      selectedModel: controlledModel,
      onModelChange,
      align = "center",
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState(false);
    const [isSmoothResize, setIsSmoothResize] = useState(false);
    const [localValue, setLocalValue] = useState(defaultValue);
    const [localModel, setLocalModel] = useState(models[0]);
    const selectedModel = controlledModel ?? localModel;
    const setSelectedModel = onModelChange ?? setLocalModel;
    const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);

    const [hoverStyle, setHoverStyle] = useState({ opacity: 0, transform: "translateY(0px) scale(0.95)", transition: "none" });
    const [containerHeight, setContainerHeight] = useState(116);
    const [textareaHeight, setTextareaHeight] = useState(68);
    const [isScrolling, setIsScrolling] = useState(false);

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : localValue;
    const hasValue = value.trim() !== "";

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const internalContainerRef = useRef<HTMLDivElement>(null);
    const topFadeRef = useRef<HTMLDivElement>(null);
    const bottomFadeRef = useRef<HTMLDivElement>(null);

    const updateFades = () => {
      const el = textareaRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (topFadeRef.current) {
        topFadeRef.current.style.opacity = Math.min(scrollTop / 20, 1).toString();
      }
      if (bottomFadeRef.current) {
        const bottomScroll = scrollHeight - clientHeight - scrollTop;
        bottomFadeRef.current.style.opacity = Math.min(Math.max(bottomScroll - 16, 0) / 10, 1).toString();
      }
    };

    const handleValueChange = useCallback((val: string) => {
      setIsSmoothResize(true);
      if (!isControlled) setLocalValue(val);
      onChange?.(val);
    }, [isControlled, onChange]);

    const expand = () => {
      setIsSmoothResize(false);
      setExpanded(true);
    };

    useEffect(() => {
      if (value.trim() !== "" && !expanded) {
        setIsSmoothResize(false);
        setExpanded(true);
      }
    }, [value, expanded]);

    useEffect(() => {
      if (expanded) {
        const timer = setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [expanded]);

    useEffect(() => {
      if (!textareaRef.current) return;
      const el = textareaRef.current;

      const currentHeight = el.style.height;
      el.style.transition = "none";
      el.style.height = "0px";
      const scrollHeight = el.scrollHeight;
      el.style.height = currentHeight;
      void el.offsetHeight;
      el.style.transition = "";

      const newHeight = Math.max(68, Math.min(scrollHeight, 160));
      el.style.height = `${newHeight}px`;

      setTextareaHeight(newHeight);
      setIsScrolling(scrollHeight > 160);

      setTimeout(updateFades, 0);
    }, [value, expanded]);

    useEffect(() => {
      setContainerHeight(Math.max(116, textareaHeight + 48));
      setTimeout(updateFades, 0);
    }, [textareaHeight]);

    useEffect(() => {
      if (!isModelSelectOpen) return;
      const handleOutsideClick = (e: MouseEvent) => {
        if (internalContainerRef.current && !internalContainerRef.current.contains(e.target as Node)) {
          setIsModelSelectOpen(false);
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isModelSelectOpen]);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      if (internalContainerRef.current && internalContainerRef.current.contains(e.relatedTarget as Node)) return;
      if (value.trim() === "") {
        setIsSmoothResize(false);
        setExpanded(false);
        setIsModelSelectOpen(false);
      }
    };

    const handleSubmit = () => {
      if (value.trim() === "") return;
      setIsSmoothResize(false);
      onSubmit?.(value, { model: selectedModel });
      handleValueChange("");
      setExpanded(false);
      setIsModelSelectOpen(false);
    };

    return (
      <div
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          internalContainerRef.current = node;
        }}
        onBlur={handleBlur}
        className={cn("relative flex flex-col w-full", className)}
        style={{
          maxWidth: expanded ? 480 : 320,
          margin: align === "start" ? "0" : "0 auto",
          transition: isSmoothResize ? "max-width 0.15s ease-out" : "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <div
          onMouseDown={(e) => {
            const isTextarea = e.target === textareaRef.current;
            if (expanded && !isTextarea) {
              e.preventDefault();
              textareaRef.current?.focus();
            }
          }}
          style={{
            borderRadius: 24,
            height: expanded ? containerHeight : 48,
            transition: isSmoothResize ? SMOOTH_HEIGHT_TRANSITION : SPRING_TRANSITION,
            overflow: expanded ? "visible" : "hidden",
          }}
          className={cn(
            "relative w-full border border-border/70 bg-card/45 shadow-sm backdrop-blur-md focus-within:border-ring/40 focus-within:ring-1 focus-within:ring-ring/20 hover:border-border/80 z-10",
            expanded ? "cursor-text" : "cursor-default"
          )}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .prompt-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; background: transparent; }
            .prompt-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .prompt-scrollbar::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
            .prompt-scrollbar:hover::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.3); }
          `}} />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            onScroll={updateFades}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === "Escape" && value.trim() === "") {
                setIsSmoothResize(false);
                setExpanded(false);
                setIsModelSelectOpen(false);
              }
            }}
            placeholder={placeholder}
            aria-label="Prompt"
            style={{
              transition: isSmoothResize
                ? "height 0.15s ease-out"
                : "opacity 0.3s ease-out, transform 0.3s ease-out, height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}
            className={cn(
              "prompt-scrollbar absolute top-0 inset-x-0 z-[1] w-full resize-none bg-transparent pl-4 pr-12 py-3.5 text-sm leading-[22px] text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground/80 cursor-text",
              expanded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
              isScrolling ? "overflow-y-auto" : "overflow-y-hidden"
            )}
          />

          <div
            ref={topFadeRef}
            className="absolute left-4 right-12 top-0 z-[2] h-8 bg-gradient-to-b from-card/70 via-card/40 to-transparent pointer-events-none"
          />
          <div
            ref={bottomFadeRef}
            className="absolute left-4 right-12 z-[2] h-8 bg-gradient-to-t from-card/70 via-card/40 to-transparent pointer-events-none"
            style={{
              opacity: 0,
              top: `${textareaHeight - 32}px`,
              transition: isSmoothResize ? "top 0.15s ease-out" : "top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}
          />

          <button
            type="button"
            onClick={expand}
            style={{ transition: isSmoothResize ? "none" : "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
            className={cn(
              "absolute inset-x-0 top-0 z-[1] cursor-text pl-4 pr-12 py-[15px] text-left text-sm font-medium leading-[17px] text-muted-foreground/80 outline-none",
              !expanded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-105 translate-y-1 pointer-events-none"
            )}
            aria-label="Open prompt input"
          >
            {placeholder}
          </button>

          <div
            className={cn(
              "absolute bottom-2 left-3 right-12 z-[10] flex items-center gap-0 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
              expanded ? "opacity-100 blur-0 translate-y-0 pointer-events-auto" : "opacity-0 blur-sm translate-y-2 pointer-events-none"
            )}
          >
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModelSelectOpen((prev) => !prev);
                }}
                className={cn(
                  "group flex items-center gap-1 rounded-full px-2 py-1 text-foreground/50 transition-all duration-200 outline-none hover:bg-accent/60 hover:text-foreground cursor-default",
                  isModelSelectOpen ? "bg-accent/60 text-foreground" : ""
                )}
                aria-label={`Select tool. Current: ${selectedModel}`}
              >
                <ModelIcon model={selectedModel} className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs font-semibold select-none transition-colors">
                  <MorphingText text={selectedModel} />
                </span>
              </button>

              {/* Opens downward so it never covers the hero copy above the input */}
              <div
                style={{ transformOrigin: "top left" }}
                onMouseLeave={() => {
                  setHoverStyle((prev) => ({
                    ...prev, opacity: 0, transform: prev.transform.replace("scale(1)", "scale(0.95)"), transition: "opacity 0.2s ease-in, transform 0.2s ease-out",
                  }));
                }}
                className={cn(
                  "absolute top-full left-0 mt-2.5 z-50 w-44 rounded-2xl border border-border/70 bg-card/80 p-1 shadow-xl backdrop-blur-xl flex flex-col gap-0.5 transition-all duration-400 cursor-default",
                  isModelSelectOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                )}
              >
                <div className="relative flex flex-col gap-0.5">
                  <div style={hoverStyle} className="absolute left-0 right-0 top-0 h-8 -z-10 rounded-xl bg-accent pointer-events-none" />
                  {models.map((model, idx) => (
                    <button
                      key={model}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => {
                        setHoverStyle((prev) => ({
                          opacity: 1, transform: `translateY(${idx * 34}px) scale(1)`,
                          transition: prev.opacity === 0 ? "opacity 0.15s ease-out" : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease",
                        }));
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedModel(model); setIsModelSelectOpen(false); }}
                      className="group relative flex h-8 w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-foreground/80 outline-none active:scale-[0.98] cursor-default"
                    >
                      <span className="flex items-center gap-2">
                        <ModelIcon model={model} className="size-3.5 opacity-85 group-hover:opacity-100 transition-opacity" />
                        {model}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => {
              e.preventDefault();
              if (hasValue) handleSubmit();
              else expand();
            }}
            aria-label="Send prompt"
            style={{ borderRadius: 9999 }}
            className={cn(
              "absolute right-2 bottom-2 z-[10] flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-default",
              hasValue ? "opacity-100 hover:opacity-90" : "opacity-50"
            )}
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    );
  }
);

PromptInput.displayName = "PromptInput";
