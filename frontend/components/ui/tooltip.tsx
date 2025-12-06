"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function TooltipProvider({
  delayDuration = 0,
  children,
  ...props
}: { 
  delayDuration?: number;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <div data-slot="tooltip-provider" {...props}>
      {children}
    </div>
  );
}

function Tooltip({
  children,
  open: controlledOpen,
  onOpenChange,
  ...props
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: any;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange]);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <TooltipProvider>
        <div data-slot="tooltip" {...props}>
          {children}
        </div>
      </TooltipProvider>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  children,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipTrigger must be used within Tooltip");

  const handleMouseEnter = () => {
    context.setOpen(true);
  };

  const handleMouseLeave = () => {
    context.setOpen(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      ...props,
    } as any);
  }

  return (
    <button
      data-slot="tooltip-trigger"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  side = "top",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipContent must be used within Tooltip");

  if (!context.open) return null;

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: `${sideOffset}px` },
    bottom: { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: `${sideOffset}px` },
    left: { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: `${sideOffset}px` },
    right: { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: `${sideOffset}px` },
  };

  return (
    <div
      data-slot="tooltip-content"
      className={cn(
        "bg-primary text-primary-foreground z-50 w-fit rounded-md px-3 py-1.5 text-xs",
        className,
      )}
      style={{
        position: "absolute",
        ...positionStyles[side],
      }}
      {...props}
    >
      {children}
      <div
        className="bg-primary absolute size-2.5 rotate-45 rounded-[2px]"
        style={{
          ...(side === "top" && { bottom: "-4px", left: "50%", transform: "translateX(-50%)" }),
          ...(side === "bottom" && { top: "-4px", left: "50%", transform: "translateX(-50%)" }),
          ...(side === "left" && { right: "-4px", top: "50%", transform: "translateY(-50%)" }),
          ...(side === "right" && { left: "-4px", top: "50%", transform: "translateY(-50%)" }),
        }}
      />
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
