"use client";

import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyNavigationMenuProps =
  React.ComponentPropsWithoutRef<typeof NavigationMenu.Root> & {
    label?: string;
  };

export function GummyNavigationMenu({
  label = "Primary",
  className,
  ...props
}: GummyNavigationMenuProps) {
  return (
    <NavigationMenu.Root
      {...props}
      aria-label={label}
      className={joinClassNames("gummy-navigation-menu", className)}
    />
  );
}

export const GummyNavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenu.List>
>(function GummyNavigationMenuList({ className, ...props }, ref) {
  return <NavigationMenu.List {...props} ref={ref} className={joinClassNames("gummy-navigation-menu__list", className)} />;
});

export const GummyNavigationMenuItem = NavigationMenu.Item;

export const GummyNavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenu.Trigger>
>(function GummyNavigationMenuTrigger({ className, children, ...props }, ref) {
  return (
    <NavigationMenu.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-navigation-menu__trigger", className)}
    >
      {children}<span className="gummy-navigation-menu__icon" aria-hidden="true">⌄</span>
    </NavigationMenu.Trigger>
  );
});

export const GummyNavigationMenuContent = NavigationMenu.Content;

export function GummyNavigationMenuPortal({
  children,
}: React.PropsWithChildren) {
  return <>{children}</>;
}

export function GummyNavigationMenuPositioner({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={joinClassNames("gummy-floating-positioner", className)}>{children}</div>;
}

export const GummyNavigationMenuPopup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyNavigationMenuPopup({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-navigation-menu__popup", className)} />;
});

export const GummyNavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenu.Viewport>
>(function GummyNavigationMenuViewport({ className, ...props }, ref) {
  return <NavigationMenu.Viewport {...props} ref={ref} className={joinClassNames("gummy-navigation-menu__viewport", className)} />;
});

export const GummyNavigationMenuLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationMenu.Link>
>(function GummyNavigationMenuLink({ className, ...props }, ref) {
  return <NavigationMenu.Link {...props} ref={ref} className={joinClassNames("gummy-navigation-menu__link", className)} />;
});

GummyNavigationMenuList.displayName = "GummyNavigationMenuList";
GummyNavigationMenuTrigger.displayName = "GummyNavigationMenuTrigger";
GummyNavigationMenuPopup.displayName = "GummyNavigationMenuPopup";
GummyNavigationMenuViewport.displayName = "GummyNavigationMenuViewport";
GummyNavigationMenuLink.displayName = "GummyNavigationMenuLink";
