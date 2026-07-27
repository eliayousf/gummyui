"use client";

import { NavigationMenu } from "@base-ui/react/navigation-menu";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyNavigationMenuProps = NavigationMenu.Root.Props & {
  label?: string;
};

export function GummyNavigationMenu({
  label = "Primary",
  className,
  ...props
}: GummyNavigationMenuProps) {
  return <NavigationMenu.Root {...props} aria-label={label} className={joinClassNames("gummy-navigation-menu", className as string)} />;
}

export const GummyNavigationMenuList = React.forwardRef<
  HTMLUListElement,
  NavigationMenu.List.Props
>(function GummyNavigationMenuList({ className, ...props }, ref) {
  return <NavigationMenu.List {...props} ref={ref} className={joinClassNames("gummy-navigation-menu__list", className as string)} />;
});

export const GummyNavigationMenuItem = NavigationMenu.Item;

export const GummyNavigationMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  NavigationMenu.Trigger.Props
>(function GummyNavigationMenuTrigger({ className, children, ...props }, ref) {
  return (
    <NavigationMenu.Trigger {...props} ref={ref} className={joinClassNames("gummy-navigation-menu__trigger", className as string)}>
      {children}<NavigationMenu.Icon className="gummy-navigation-menu__icon">⌄</NavigationMenu.Icon>
    </NavigationMenu.Trigger>
  );
});

export const GummyNavigationMenuContent = NavigationMenu.Content;
export const GummyNavigationMenuPortal = NavigationMenu.Portal;
export const GummyNavigationMenuViewport = NavigationMenu.Viewport;

export const GummyNavigationMenuPositioner = React.forwardRef<
  HTMLDivElement,
  NavigationMenu.Positioner.Props
>(function GummyNavigationMenuPositioner({ className, sideOffset = 10, ...props }, ref) {
  return <NavigationMenu.Positioner {...props} ref={ref} sideOffset={sideOffset} className={joinClassNames("gummy-floating-positioner", className as string)} />;
});

export const GummyNavigationMenuPopup = React.forwardRef<
  HTMLDivElement,
  NavigationMenu.Popup.Props
>(function GummyNavigationMenuPopup({ className, ...props }, ref) {
  return <NavigationMenu.Popup {...props} ref={ref} className={joinClassNames("gummy-navigation-menu__popup", className as string)} />;
});

export const GummyNavigationMenuLink = React.forwardRef<
  HTMLAnchorElement,
  NavigationMenu.Link.Props
>(function GummyNavigationMenuLink({ className, ...props }, ref) {
  return <NavigationMenu.Link {...props} ref={ref} className={joinClassNames("gummy-navigation-menu__link", className as string)} />;
});

GummyNavigationMenuList.displayName = "GummyNavigationMenuList";
GummyNavigationMenuTrigger.displayName = "GummyNavigationMenuTrigger";
GummyNavigationMenuPositioner.displayName = "GummyNavigationMenuPositioner";
GummyNavigationMenuPopup.displayName = "GummyNavigationMenuPopup";
GummyNavigationMenuLink.displayName = "GummyNavigationMenuLink";
