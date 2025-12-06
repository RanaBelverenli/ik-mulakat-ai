"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function DropdownMenu({ 
  children, 
  open: controlledOpen,
  onOpenChange 
}: { 
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ 
  children, 
  asChild,
  ...props 
}: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  const handleClick = () => {
    context.setOpen(!context.open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick, ...props } as any);
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function DropdownMenuContent({ 
  className, 
  children,
  align = "start",
  sideOffset = 4,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu");

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (context.open && !(event.currentTarget as Element)?.contains(target)) {
        context.setOpen(false);
      }
    };

    if (context.open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [context.open, context.setOpen]);

  if (!context.open) return null;

  return (
    <div
      className={cn(
        "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md",
        className
      )}
      style={{
        position: "absolute",
        top: "100%",
        left: align === "start" ? "0" : align === "end" ? "auto" : "50%",
        right: align === "end" ? "0" : undefined,
        transform: align === "center" ? "translateX(-50%)" : undefined,
        marginTop: `${sideOffset}px`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuGroup({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props} />
  );
}

function DropdownMenuItem({ 
  className, 
  inset,
  variant = "default",
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  const context = React.useContext(DropdownMenuContext);

  return (
    <button
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none disabled:pointer-events-none disabled:opacity-50",
        inset && "pl-8",
        variant === "destructive" && "text-destructive focus:bg-destructive/10",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e);
        context?.setOpen(false);
      }}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({ 
  className, 
  children, 
  checked,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean;
}) {
  const context = React.useContext(DropdownMenuContext);

  return (
    <button
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e);
        context?.setOpen(false);
      }}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

function DropdownMenuRadioGroup({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props} />
  );
}

function DropdownMenuRadioItem({ 
  className, 
  children, 
  checked,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean;
}) {
  const context = React.useContext(DropdownMenuContext);

  return (
    <button
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e);
        context?.setOpen(false);
      }}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && (
          <svg className="h-2 w-2 fill-current" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

function DropdownMenuLabel({ 
  className, 
  inset,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-sm font-medium",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

function DropdownMenuSubTrigger({ 
  className, 
  inset,
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  inset?: boolean;
}) {
  return (
    <button
      className={cn(
        "focus:bg-accent focus:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <svg className="ml-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function DropdownMenuSubContent({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
