"use client";

import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("GummySidebar parts must be used inside GummySidebar.");
  return context;
}

export type GummySidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const GummySidebar = React.forwardRef<HTMLDivElement, GummySidebarProps>(
  function GummySidebar(
    {
      open: controlledOpen,
      defaultOpen = true,
      onOpenChange,
      className,
      ...props
    },
    ref,
  ) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = React.useCallback((next: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    }, [controlledOpen, onOpenChange]);
    return (
      <SidebarContext.Provider value={{ open, setOpen }}>
        <div
          {...props}
          ref={ref}
          className={joinClassNames("gummy-sidebar-layout", className)}
          data-open={open || undefined}
        />
      </SidebarContext.Provider>
    );
  },
);

GummySidebar.displayName = "GummySidebar";

export const GummySidebarPanel = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { label?: string }
>(function GummySidebarPanel(
  { label = "Workspace", className, ...props },
  ref,
) {
  const { open } = useSidebar();
  return (
    <aside
      {...props}
      ref={ref}
      className={joinClassNames("gummy-sidebar", className)}
      aria-label={label}
      data-open={open || undefined}
    />
  );
});

GummySidebarPanel.displayName = "GummySidebarPanel";

export const GummySidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function GummySidebarTrigger({ className, children, ...props }, ref) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={joinClassNames("gummy-sidebar__trigger", className)}
      aria-expanded={open}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) setOpen(!open);
      }}
    >
      {children ?? (open ? "Collapse sidebar" : "Expand sidebar")}
    </button>
  );
});

GummySidebarTrigger.displayName = "GummySidebarTrigger";

export const GummySidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function GummySidebarHeader({ className, ...props }, ref) {
    return <div {...props} ref={ref} className={joinClassNames("gummy-sidebar__header", className)} />;
  },
);
export const GummySidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function GummySidebarContent({ className, ...props }, ref) {
    return <div {...props} ref={ref} className={joinClassNames("gummy-sidebar__content", className)} />;
  },
);
export const GummySidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function GummySidebarFooter({ className, ...props }, ref) {
    return <div {...props} ref={ref} className={joinClassNames("gummy-sidebar__footer", className)} />;
  },
);
export const GummySidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function GummySidebarGroup({ className, ...props }, ref) {
    return <div {...props} ref={ref} className={joinClassNames("gummy-sidebar__group", className)} />;
  },
);
export const GummySidebarGroupLabel = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function GummySidebarGroupLabel({ className, ...props }, ref) {
    return <h3 {...props} ref={ref} className={joinClassNames("gummy-sidebar__group-label", className)} />;
  },
);
export const GummySidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  function GummySidebarMenu({ className, ...props }, ref) {
    return <ul {...props} ref={ref} className={joinClassNames("gummy-sidebar__menu", className)} />;
  },
);
export const GummySidebarMenuItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  function GummySidebarMenuItem({ className, ...props }, ref) {
    return <li {...props} ref={ref} className={joinClassNames("gummy-sidebar__menu-item", className)} />;
  },
);
export const GummySidebarMenuLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { current?: boolean }>(
  function GummySidebarMenuLink({ current = false, className, ...props }, ref) {
    return <a {...props} ref={ref} className={joinClassNames("gummy-sidebar__menu-link", className)} aria-current={current ? "page" : undefined} />;
  },
);
export const GummySidebarInset = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { as?: "main" | "div" }
>(
  function GummySidebarInset({ as = "main", className, ...props }, ref) {
    const Root = as;
    return <Root {...props} ref={ref as never} className={joinClassNames("gummy-sidebar__inset", className)} />;
  },
);

GummySidebarHeader.displayName = "GummySidebarHeader";
GummySidebarContent.displayName = "GummySidebarContent";
GummySidebarFooter.displayName = "GummySidebarFooter";
GummySidebarGroup.displayName = "GummySidebarGroup";
GummySidebarGroupLabel.displayName = "GummySidebarGroupLabel";
GummySidebarMenu.displayName = "GummySidebarMenu";
GummySidebarMenuItem.displayName = "GummySidebarMenuItem";
GummySidebarMenuLink.displayName = "GummySidebarMenuLink";
GummySidebarInset.displayName = "GummySidebarInset";
