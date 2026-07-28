"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ContentProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.Content>;
type PositioningProps = Pick<
  ContentProps,
  "align" | "alignOffset" | "side" | "sideOffset" | "collisionPadding"
>;

const PositioningContext = React.createContext<PositioningProps>({});

export const GummyDropdownMenu = DropdownMenu.Root;
export const GummyDropdownMenuPortal = DropdownMenu.Portal;

export const GummyDropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Trigger>
>(function GummyDropdownMenuTrigger({ className, children, ...props }, ref) {
  return (
    <DropdownMenu.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-menu__trigger", className)}
    >
      <span className="gummy-menu__trigger-copy">{children}</span>
      <span className="gummy-menu__trigger-pool" aria-hidden="true">
        <svg className="gummy-menu__chevron" viewBox="0 0 14 10">
          <path d="m2 2.5 5 5 5-5" />
        </svg>
      </span>
    </DropdownMenu.Trigger>
  );
});

export type GummyDropdownMenuPositionerProps =
  React.PropsWithChildren<PositioningProps & { className?: string }>;

export function GummyDropdownMenuPositioner({
  children,
  className,
  ...positioning
}: GummyDropdownMenuPositionerProps) {
  return (
    <PositioningContext.Provider value={positioning}>
      <div className={joinClassNames("gummy-menu__positioner", className)}>
        {children}
      </div>
    </PositioningContext.Provider>
  );
}

export const GummyDropdownMenuPopup = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Content>,
  ContentProps
>(function GummyDropdownMenuPopup(
  { className, children, sideOffset, ...props },
  ref,
) {
  const positioning = React.useContext(PositioningContext);
  return (
    <DropdownMenu.Content
      {...positioning}
      {...props}
      ref={ref}
      sideOffset={sideOffset ?? positioning.sideOffset ?? 0}
      className={joinClassNames("gummy-menu__popup", className)}
    >
      <span className="gummy-menu__bridge" aria-hidden="true" />
      <span className="gummy-menu__reservoir" aria-hidden="true" />
      <div className="gummy-menu__reading-plane">{children}</div>
    </DropdownMenu.Content>
  );
});

export type GummyDropdownMenuItemProps =
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Item> & {
    icon?: React.ReactNode;
    selected?: boolean;
  };

export const GummyDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Item>,
  GummyDropdownMenuItemProps
>(function GummyDropdownMenuItem(
  { className, children, icon, selected = false, ...props },
  ref,
) {
  return (
    <DropdownMenu.Item
      {...props}
      ref={ref}
      className={joinClassNames("gummy-menu__item", className)}
      data-selected={selected || undefined}
      data-has-icon={Boolean(icon) || undefined}
    >
      <span className="gummy-menu__item-tide" aria-hidden="true" />
      {icon ? <span className="gummy-menu__item-icon" aria-hidden="true">{icon}</span> : null}
      <span className="gummy-menu__item-copy">{children}</span>
      {selected ? <span className="gummy-menu__item-state">Selected</span> : null}
    </DropdownMenu.Item>
  );
});

export const GummyDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Separator>
>(function GummyDropdownMenuSeparator({ className, ...props }, ref) {
  return <DropdownMenu.Separator {...props} ref={ref} className={joinClassNames("gummy-menu__separator", className)} />;
});

GummyDropdownMenuTrigger.displayName = "GummyDropdownMenuTrigger";
GummyDropdownMenuPopup.displayName = "GummyDropdownMenuPopup";
GummyDropdownMenuItem.displayName = "GummyDropdownMenuItem";
GummyDropdownMenuSeparator.displayName = "GummyDropdownMenuSeparator";
