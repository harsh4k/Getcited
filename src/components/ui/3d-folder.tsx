"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface Project {
  id: string;
  image: string;
  title: string;
}

interface AnimatedFolderProps {
  title: string;
  projects: Project[];
  className?: string;
}

export function AnimatedFolder({
  title,
  projects,
  className,
}: AnimatedFolderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const [hiddenCardId, setHiddenCardId] = useState<string | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleProjectClick = (project: Project, index: number) => {
    const cardEl = cardRefs.current[index];
    if (cardEl) {
      setSourceRect(cardEl.getBoundingClientRect());
    }
    setSelectedIndex(index);
    setHiddenCardId(project.id);
  };

  const handleCloseLightbox = () => {
    setSelectedIndex(null);
    setSourceRect(null);
  };

  const handleCloseComplete = () => {
    setHiddenCardId(null);
  };

  const handleNavigate = (newIndex: number) => {
    setSelectedIndex(newIndex);
    setHiddenCardId(projects[newIndex]?.id || null);
  };

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center",
          "p-8 rounded-2xl cursor-pointer",
          "bg-bg-secondary border border-border",
          "transition-all duration-500 ease-out",
          "hover:shadow-2xl hover:shadow-accent/10",
          "hover:border-accent/30",
          "group",
          className
        )}
        style={{
          minWidth: "280px",
          minHeight: "320px",
          perspective: "1000px",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Subtle background glow on hover */}
        <div
          className="absolute inset-0 rounded-2xl transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at 50% 70%, var(--accent) 0%, transparent 70%)",
            opacity: isHovered ? 0.08 : 0,
          }}
        />

        <div
          className="relative flex items-center justify-center mb-4"
          style={{ height: "160px", width: "200px" }}
        >
          {/* Folder back layer */}
          <div
            className="absolute w-32 h-24 bg-folder-back rounded-lg shadow-md"
            style={{
              transformOrigin: "bottom center",
              transform: isHovered ? "rotateX(-15deg)" : "rotateX(0deg)",
              transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: 10,
            }}
          />

          {/* Folder tab */}
          <div
            className="absolute w-12 h-4 bg-folder-tab rounded-t-md"
            style={{
              top: "calc(50% - 48px - 12px)",
              left: "calc(50% - 64px + 16px)",
              transformOrigin: "bottom center",
              transform: isHovered
                ? "rotateX(-25deg) translateY(-2px)"
                : "rotateX(0deg)",
              transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: 10,
            }}
          />

          {/* Project cards — between back and front layers */}
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20,
            }}
          >
            {projects.slice(0, 3).map((project, index) => (
              <ProjectCard
                key={project.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                image={project.image}
                title={project.title}
                delay={index * 80}
                isVisible={isHovered}
                index={index}
                onClick={() => handleProjectClick(project, index)}
                isSelected={hiddenCardId === project.id}
              />
            ))}
          </div>

          {/* Folder front layer */}
          <div
            className="absolute w-32 h-24 bg-folder-front rounded-lg shadow-lg"
            style={{
              top: "calc(50% - 48px + 4px)",
              transformOrigin: "bottom center",
              transform: isHovered
                ? "rotateX(25deg) translateY(8px)"
                : "rotateX(0deg)",
              transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: 30,
            }}
          />

          {/* Folder shine effect */}
          <div
            className="absolute w-32 h-24 rounded-lg overflow-hidden pointer-events-none"
            style={{
              top: "calc(50% - 48px + 4px)",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
              transformOrigin: "bottom center",
              transform: isHovered
                ? "rotateX(25deg) translateY(8px)"
                : "rotateX(0deg)",
              transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: 31,
            }}
          />
        </div>

        {/* Folder title */}
        <h3
          className="text-lg font-semibold text-text-primary mt-4 transition-all duration-300"
          style={{
            transform: isHovered ? "translateY(4px)" : "translateY(0)",
          }}
        >
          {title}
        </h3>

        {/* Project count */}
        <p
          className="text-sm text-text-secondary transition-all duration-300"
          style={{
            opacity: isHovered ? 0.7 : 1,
          }}
        >
          {projects.length} projects
        </p>

        {/* Hover hint */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs text-text-secondary transition-all duration-300"
          style={{
            opacity: isHovered ? 0 : 0.6,
            transform: isHovered ? "translateY(10px)" : "translateY(0)",
          }}
        >
          <span>Hover to explore</span>
        </div>
      </div>

      <ImageLightbox
        projects={projects.slice(0, 3)}
        currentIndex={selectedIndex ?? 0}
        isOpen={selectedIndex !== null}
        onClose={handleCloseLightbox}
        sourceRect={sourceRect}
        onCloseComplete={handleCloseComplete}
        onNavigate={handleNavigate}
      />
    </>
  );
}

interface ProjectCardProps {
  image: string;
  title: string;
  delay: number;
  isVisible: boolean;
  index: number;
  onClick: () => void;
  isSelected: boolean;
}

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  ({ image, title, delay, isVisible, index, onClick, isSelected }, ref) => {
    // Fan the three cards out of the folder mouth on hover
    const spread = (index - 1) * 56;
    const rotation = (index - 1) * 12;

    return (
      <div
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="absolute w-20 h-24 rounded-md overflow-hidden border border-border bg-bg-tertiary shadow-lg cursor-pointer"
        style={{
          top: "-48px",
          left: "-40px",
          opacity: isSelected ? 0 : isVisible ? 1 : 0,
          transform: isVisible
            ? `translate(${spread}px, -56px) rotate(${rotation}deg) scale(1)`
            : "translate(0px, 8px) rotate(0deg) scale(0.6)",
          transition: `transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, opacity 300ms ease ${delay}ms`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>
    );
  }
);
ProjectCard.displayName = "ProjectCard";

interface ImageLightboxProps {
  projects: Project[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  sourceRect: DOMRect | null;
  onCloseComplete?: () => void;
  onNavigate: (index: number) => void;
}

function ImageLightbox({
  projects,
  currentIndex,
  isOpen,
  onClose,
  sourceRect,
  onCloseComplete,
  onNavigate,
}: ImageLightboxProps) {
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "animating" | "complete"
  >("initial");
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalProjects = projects.length;
  const hasNext = currentIndex < totalProjects - 1;
  const hasPrev = currentIndex > 0;
  const currentProject = projects[currentIndex];

  // Brief gate so rapid clicks don't skip the slide transition
  useEffect(() => {
    if (!isOpen) return;
    setIsSliding(true);
    const timer = setTimeout(() => setIsSliding(false), 400);
    return () => clearTimeout(timer);
  }, [currentIndex, isOpen]);

  const navigateNext = useCallback(() => {
    if (currentIndex >= totalProjects - 1 || isSliding) return;
    onNavigate(currentIndex + 1);
  }, [currentIndex, totalProjects, isSliding, onNavigate]);

  const navigatePrev = useCallback(() => {
    if (currentIndex <= 0 || isSliding) return;
    onNavigate(currentIndex - 1);
  }, [currentIndex, isSliding, onNavigate]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    onClose();
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      setAnimationPhase("initial");
      onCloseComplete?.();
    }, 400);
  }, [onClose, onCloseComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") navigateNext();
      if (e.key === "ArrowLeft") navigatePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose, navigateNext, navigatePrev]);

  useLayoutEffect(() => {
    if (isOpen && sourceRect) {
      setShouldRender(true);
      setAnimationPhase("initial");
      setIsClosing(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationPhase("animating");
        });
      });
      const timer = setTimeout(() => {
        setAnimationPhase("complete");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sourceRect]);

  const handleDotClick = (idx: number) => {
    if (isSliding || idx === currentIndex) return;
    onNavigate(idx);
  };

  if (!shouldRender || !currentProject) return null;

  const getInitialStyles = (): React.CSSProperties => {
    if (!sourceRect) return {};

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetWidth = Math.min(768, viewportWidth - 64);
    const targetHeight = Math.min(viewportHeight * 0.85, 600);

    const targetX = (viewportWidth - targetWidth) / 2;
    const targetY = (viewportHeight - targetHeight) / 2;

    const scaleX = sourceRect.width / targetWidth;
    const scaleY = sourceRect.height / targetHeight;
    const scale = Math.max(scaleX, scaleY);

    const translateX =
      sourceRect.left + sourceRect.width / 2 - (targetX + targetWidth / 2);
    const translateY =
      sourceRect.top + sourceRect.height / 2 - (targetY + targetHeight / 2);

    return {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      opacity: 1,
    };
  };

  const getFinalStyles = (): React.CSSProperties => ({
    transform: "translate(0, 0) scale(1)",
    opacity: 1,
  });

  const panelStyles = isClosing
    ? { ...getInitialStyles(), opacity: 0 }
    : animationPhase === "initial"
      ? getInitialStyles()
      : getFinalStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn(
          "absolute inset-0 bg-bg-primary/80 backdrop-blur-sm transition-opacity duration-500",
          animationPhase === "initial" || isClosing
            ? "opacity-0"
            : "opacity-100"
        )}
        onClick={handleClose}
      />

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-2xl"
        style={{
          width: "min(768px, calc(100vw - 64px))",
          height: "min(85vh, 600px)",
          transition:
            "transform 450ms cubic-bezier(0.32, 0.72, 0, 1), opacity 400ms ease",
          ...panelStyles,
        }}
      >
        <div
          className="flex h-full"
          style={{
            width: `${totalProjects * 100}%`,
            transform: `translateX(-${currentIndex * (100 / totalProjects)}%)`,
            transition: "transform 400ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {projects.map((project) => (
            <div
              key={project.id}
              className="relative h-full"
              style={{ width: `${100 / totalProjects}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image}
                alt={project.title}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-primary/85 to-transparent p-5">
                <p className="text-sm font-medium text-text-primary">
                  {project.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-bg-primary/60 text-text-primary transition-colors hover:bg-bg-primary"
        >
          <X size={18} />
        </button>

        {hasPrev && (
          <button
            type="button"
            aria-label="Previous project"
            onClick={navigatePrev}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg-primary/60 text-text-primary transition-colors hover:bg-bg-primary"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            aria-label="Next project"
            onClick={navigateNext}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg-primary/60 text-text-primary transition-colors hover:bg-bg-primary"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <div className="absolute inset-x-0 bottom-16 flex justify-center gap-2">
          {projects.map((project, idx) => (
            <button
              key={project.id}
              type="button"
              aria-label={`Go to ${project.title}`}
              onClick={() => handleDotClick(idx)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                idx === currentIndex ? "bg-accent" : "bg-text-tertiary/60"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
