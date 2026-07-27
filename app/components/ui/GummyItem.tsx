import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyItemProps = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "li";
  selected?: boolean;
  density?: "default" | "compact";
};

export const GummyItem = React.forwardRef<HTMLElement, GummyItemProps>(
  function GummyItem(
    {
      as = "div",
      selected = false,
      density = "default",
      className,
      ...props
    },
    ref,
  ) {
    const Root = as;
    return (
      <Root
        {...props}
        ref={ref as never}
        className={joinClassNames("gummy-item", className)}
        data-selected={selected || undefined}
        data-density={density}
      />
    );
  },
);

GummyItem.displayName = "GummyItem";

export type GummyItemLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  selected?: boolean;
  density?: "default" | "compact";
};

export const GummyItemLink = React.forwardRef<
  HTMLAnchorElement,
  GummyItemLinkProps
>(function GummyItemLink(
  { selected = false, density = "default", className, ...props },
  ref,
) {
  return (
    <a
      {...props}
      ref={ref}
      className={joinClassNames("gummy-item gummy-item--interactive", className)}
      data-selected={selected || undefined}
      data-density={density}
    />
  );
});

GummyItemLink.displayName = "GummyItemLink";

export type GummyItemButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  density?: "default" | "compact";
};

export const GummyItemButton = React.forwardRef<
  HTMLButtonElement,
  GummyItemButtonProps
>(function GummyItemButton(
  {
    selected = false,
    density = "default",
    type = "button",
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={joinClassNames("gummy-item gummy-item--interactive", className)}
      data-selected={selected || undefined}
      data-density={density}
    />
  );
});

GummyItemButton.displayName = "GummyItemButton";

export const GummyItemMedia = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function GummyItemMedia({ className, ...props }, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={joinClassNames("gummy-item__media", className)}
    />
  );
});

GummyItemMedia.displayName = "GummyItemMedia";

export const GummyItemContent = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function GummyItemContent({ className, ...props }, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={joinClassNames("gummy-item__content", className)}
    />
  );
});

GummyItemContent.displayName = "GummyItemContent";

export const GummyItemTitle = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function GummyItemTitle({ className, ...props }, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={joinClassNames("gummy-item__title", className)}
    />
  );
});

GummyItemTitle.displayName = "GummyItemTitle";

export const GummyItemDescription = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function GummyItemDescription({ className, ...props }, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={joinClassNames("gummy-item__description", className)}
    />
  );
});

GummyItemDescription.displayName = "GummyItemDescription";

export const GummyItemActions = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function GummyItemActions({ className, ...props }, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={joinClassNames("gummy-item__actions", className)}
    />
  );
});

GummyItemActions.displayName = "GummyItemActions";
