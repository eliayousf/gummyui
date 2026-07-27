"use client";

import { Menu } from "@base-ui/react/menu";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyDropdownMenu = Menu.Root;
export const GummyDropdownMenuPortal = Menu.Portal;

export const GummyDropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  Menu.Trigger.Props
>(function GummyDropdownMenuTrigger({ className, children, ...props }, ref) {
  return (
    <Menu.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-menu__trigger", className as string)}
    >
      <span className="gummy-menu__trigger-copy">{children}</span>
      <span className="gummy-menu__trigger-pool" aria-hidden="true">
        <svg className="gummy-menu__chevron" viewBox="0 0 14 10">
          <path d="m2 2.5 5 5 5-5" />
        </svg>
      </span>
    </Menu.Trigger>
  );
});

export const GummyDropdownMenuPositioner = React.forwardRef<
  HTMLDivElement,
  Menu.Positioner.Props
>(function GummyDropdownMenuPositioner({ className, sideOffset = 0, ...props }, ref) {
  return (
    <Menu.Positioner
      {...props}
      ref={ref}
      sideOffset={sideOffset}
      className={joinClassNames("gummy-menu__positioner", className as string)}
    />
  );
});

export const GummyDropdownMenuPopup = React.forwardRef<
  HTMLDivElement,
  Menu.Popup.Props
>(function GummyDropdownMenuPopup({ className, children, ...props }, ref) {
  return (
    <Menu.Popup {...props} ref={ref} className={joinClassNames("gummy-menu__popup", className as string)}>
      <span className="gummy-menu__bridge" aria-hidden="true" />
      <span className="gummy-menu__reservoir" aria-hidden="true" />
      <div className="gummy-menu__reading-plane">{children}</div>
    </Menu.Popup>
  );
});

export const GummyDropdownMenuItem = React.forwardRef<
  HTMLElement,
  Menu.Item.Props & { icon?: React.ReactNode; selected?: boolean }
>(function GummyDropdownMenuItem({ className, children, icon, selected = false, ...props }, ref) {
  return (
    <Menu.Item
      {...props}
      ref={ref}
      className={joinClassNames("gummy-menu__item", className as string)}
      data-selected={selected || undefined}
      data-has-icon={Boolean(icon) || undefined}
    >
      <span className="gummy-menu__item-tide" aria-hidden="true" />
      {icon ? <span className="gummy-menu__item-icon" aria-hidden="true">{icon}</span> : null}
      <span className="gummy-menu__item-copy">{children}</span>
      {selected ? <span className="gummy-menu__item-state">Selected</span> : null}
    </Menu.Item>
  );
});

export const GummyDropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  Menu.Separator.Props
>(function GummyDropdownMenuSeparator({ className, ...props }, ref) {
  return <Menu.Separator {...props} ref={ref} className={joinClassNames("gummy-menu__separator", className as string)} />;
});

GummyDropdownMenuTrigger.displayName = "GummyDropdownMenuTrigger";
GummyDropdownMenuPositioner.displayName = "GummyDropdownMenuPositioner";
GummyDropdownMenuPopup.displayName = "GummyDropdownMenuPopup";
GummyDropdownMenuItem.displayName = "GummyDropdownMenuItem";
GummyDropdownMenuSeparator.displayName = "GummyDropdownMenuSeparator";
