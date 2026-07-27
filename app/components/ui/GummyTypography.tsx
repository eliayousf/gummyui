import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type GummyHeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  level?: HeadingLevel;
  size?: "display" | "title" | "section" | "subsection";
  balance?: boolean;
};

export const GummyHeading = React.forwardRef<
  HTMLHeadingElement,
  GummyHeadingProps
>(function GummyHeading(
  { level = 2, size = "section", balance = true, className, ...headingProps },
  ref,
) {
  const Heading = `h${level}` as React.ElementType;
  return (
    <Heading
      {...headingProps}
      ref={ref}
      className={joinClassNames("gummy-heading", className)}
      data-size={size}
      data-balance={balance || undefined}
    />
  );
});

GummyHeading.displayName = "GummyHeading";

export type GummyTextProps = React.HTMLAttributes<HTMLParagraphElement> & {
  size?: "small" | "body" | "large";
  tone?: "default" | "soft" | "muted";
  measure?: "compact" | "reading" | "wide" | "none";
};

export const GummyText = React.forwardRef<HTMLParagraphElement, GummyTextProps>(
  function GummyText(
    {
      size = "body",
      tone = "default",
      measure = "reading",
      className,
      ...textProps
    },
    ref,
  ) {
    return (
      <p
        {...textProps}
        ref={ref}
        className={joinClassNames("gummy-text", className)}
        data-size={size}
        data-tone={tone}
        data-measure={measure}
      />
    );
  },
);

GummyText.displayName = "GummyText";

export type GummyEyebrowProps = React.HTMLAttributes<HTMLParagraphElement>;

export const GummyEyebrow = React.forwardRef<
  HTMLParagraphElement,
  GummyEyebrowProps
>(function GummyEyebrow({ className, ...props }, ref) {
  return (
    <p
      {...props}
      ref={ref}
      className={joinClassNames("gummy-eyebrow", className)}
    />
  );
});

GummyEyebrow.displayName = "GummyEyebrow";

export type GummyInlineCodeProps = React.HTMLAttributes<HTMLElement>;

export const GummyInlineCode = React.forwardRef<
  HTMLElement,
  GummyInlineCodeProps
>(function GummyInlineCode({ className, ...props }, ref) {
  return (
    <code
      {...props}
      ref={ref}
      className={joinClassNames("gummy-inline-code", className)}
    />
  );
});

GummyInlineCode.displayName = "GummyInlineCode";

export type GummyBlockquoteProps = React.BlockquoteHTMLAttributes<HTMLQuoteElement> & {
  citeLabel?: React.ReactNode;
};

export const GummyBlockquote = React.forwardRef<
  HTMLQuoteElement,
  GummyBlockquoteProps
>(function GummyBlockquote(
  { citeLabel, className, children, ...quoteProps },
  ref,
) {
  return (
    <blockquote
      {...quoteProps}
      ref={ref}
      className={joinClassNames("gummy-blockquote", className)}
    >
      <span className="gummy-blockquote__pool" aria-hidden="true" />
      <div>{children}</div>
      {citeLabel ? <footer>{citeLabel}</footer> : null}
    </blockquote>
  );
});

GummyBlockquote.displayName = "GummyBlockquote";
