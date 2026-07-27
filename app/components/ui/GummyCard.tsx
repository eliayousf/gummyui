import * as React from "react";

export type GummyCardElevation = "default" | "elevated";

type CardVisualProps = {
  elevation?: GummyCardElevation;
  selected?: boolean;
};

export type GummyCardProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "onClick" | "onKeyDown" | "onKeyUp" | "tabIndex" | "role"
> & CardVisualProps;
export type GummyCardLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & CardVisualProps;
export type GummyCardButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & CardVisualProps;
export type GummyCardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /** Selects the heading level required by the surrounding document outline. */
  level?: 2 | 3 | 4 | 5 | 6;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function visualAttributes(elevation: GummyCardElevation, selected: boolean) {
  return {
    "data-elevation": elevation,
    "data-selected": selected || undefined,
  };
}

function CardFrame() {
  const frameId = React.useId().replaceAll(":", "");
  const frameRef = React.useRef<SVGSVGElement>(null);
  const [frameSize, setFrameSize] = React.useState({ width: 540, height: 330 });
  const shellGradientId = `${frameId}-shell`;
  const planeGradientId = `${frameId}-plane`;
  const reservoirGradientId = `${frameId}-reservoir`;
  const blurId = `${frameId}-blur`;

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const bounds = frame.getBoundingClientRect();
      const next = {
        width: Math.max(300, Math.round(bounds.width)),
        height: Math.max(240, Math.round(bounds.height)),
      };

      setFrameSize((current) => (
        current.width === next.width && current.height === next.height ? current : next
      ));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const width = frameSize.width;
  const height = frameSize.height;
  const outerPath = [
    "M72 10C105 15 132 12 168 13",
    `H${width - 48}C${width - 20} 13 ${width - 10} 31 ${width - 12} 58`,
    `L${width - 16} ${height - 74}`,
    `C${width - 16} ${height - 56} ${width - 4} ${height - 51} ${width - 3} ${height - 33}`,
    `C${width - 2} ${height - 10} ${width - 18} ${height - 3} ${width - 40} ${height - 4}`,
    `C${width - 62} ${height - 5} ${width - 71} ${height - 15} ${width - 94} ${height - 12}`,
    `H50C22 ${height - 12} 12 ${height - 28} 14 ${height - 54}`,
    "L9 58C8 29 24 9 51 8C59 8 65 10 72 10Z",
  ].join("");
  const planePath = [
    "M120 32C137 25 157 27 178 27",
    `H${width - 47}C${width - 28} 27 ${width - 23} 41 ${width - 24} 61`,
    `L${width - 28} ${height - 84}`,
    `C${width - 28} ${height - 69} ${width - 36} ${height - 62} ${width - 51} ${height - 57}`,
    `C${width - 64} ${height - 53} ${width - 72} ${height - 37} ${width - 88} ${height - 32}`,
    `C${width - 98} ${height - 29} ${width - 111} ${height - 28} ${width - 131} ${height - 27}`,
    `H47C31 ${height - 27} 27 ${height - 38} 28 ${height - 54}`,
    "L25 99C25 84 31 77 39 79C43 105 61 121 84 119C109 118 124 98 121 74C118 56 111 41 120 32Z",
  ].join("");
  const reservoirPath = [
    `M${width - 105} ${height - 35}`,
    `C${width - 91} ${height - 55} ${width - 66} ${height - 67} ${width - 43} ${height - 59}`,
    `C${width - 20} ${height - 51} ${width - 10} ${height - 26} ${width - 27} ${height - 10}`,
    `C${width - 43} ${height + 1} ${width - 67} ${height - 8} ${width - 96} ${height - 13}`,
    `C${width - 104} ${height - 19} ${width - 108} ${height - 27} ${width - 105} ${height - 35}Z`,
  ].join("");
  const reservoirGlintPath = `M${width - 88} ${height - 43}C${width - 72} ${height - 57} ${width - 50} ${height - 57} ${width - 37} ${height - 46}`;

  return (
    <svg
      ref={frameRef}
      className="gummy-card__frame"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={shellGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--card-frame-light)" />
          <stop offset="0.42" stopColor="var(--card-frame-core)" />
          <stop offset="1" stopColor="var(--card-frame-rim)" />
        </linearGradient>
        <linearGradient id={planeGradientId} x1="0.12" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="var(--card-plane-light)" />
          <stop offset="1" stopColor="var(--card-plane-core)" />
        </linearGradient>
        <radialGradient id={reservoirGradientId} cx="0.28" cy="0.2" r="0.9">
          <stop offset="0" stopColor="var(--card-frame-light)" />
          <stop offset="0.58" stopColor="var(--card-frame-core)" />
          <stop offset="1" stopColor="var(--card-frame-depth)" />
        </radialGradient>
        <filter id={blurId} x="-20%" y="-30%" width="150%" height="170%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <path
        className="gummy-card__frame-shadow"
        d={outerPath}
        filter={`url(#${blurId})`}
      />
      <path
        className="gummy-card__frame-shell"
        d={outerPath}
        fill={`url(#${shellGradientId})`}
      />
      <path
        className="gummy-card__frame-plane"
        d={planePath}
        fill={`url(#${planeGradientId})`}
      />
      <path
        className="gummy-card__frame-reservoir"
        d={reservoirPath}
        fill={`url(#${reservoirGradientId})`}
      />
      <path
        className="gummy-card__frame-meniscus gummy-card__frame-meniscus--outer"
        d={outerPath}
      />
      <path
        className="gummy-card__frame-meniscus gummy-card__frame-meniscus--inner"
        d={planePath}
      />
      <path
        className="gummy-card__icon-well"
        d="M42 68C40 40 57 21 83 21C110 21 126 41 124 69C122 99 106 117 83 118C58 118 43 97 42 68Z"
      />
      <path
        className="gummy-card__frame-glint"
        d="M28 56C34 28 54 18 82 22C116 27 135 20 172 24"
      />
      <path
        className="gummy-card__reservoir-glint"
        d={reservoirGlintPath}
      />
    </svg>
  );
}

export const GummyCard = React.forwardRef<HTMLElement, GummyCardProps>(
  function GummyCard(
    {
      elevation = "default",
      selected = false,
      className,
      children,
      ...cardProps
    },
    ref,
  ) {
    return (
      <article
        {...cardProps}
        {...visualAttributes(elevation, selected)}
        ref={ref}
        className={joinClassNames("gummy-card", className)}
      >
        <CardFrame />
        {children}
      </article>
    );
  },
);

GummyCard.displayName = "GummyCard";

export const GummyCardLink = React.forwardRef<HTMLAnchorElement, GummyCardLinkProps>(
  function GummyCardLink(
    {
      elevation = "default",
      selected = false,
      className,
      children,
      ...linkProps
    },
    ref,
  ) {
    return (
      <a
        {...linkProps}
        {...visualAttributes(elevation, selected)}
        ref={ref}
        className={joinClassNames("gummy-card gummy-card--interactive", className)}
        data-interactive="link"
      >
        <CardFrame />
        {children}
      </a>
    );
  },
);

GummyCardLink.displayName = "GummyCardLink";

export const GummyCardButton = React.forwardRef<HTMLButtonElement, GummyCardButtonProps>(
  function GummyCardButton(
    {
      elevation = "default",
      selected = false,
      type = "button",
      className,
      children,
      ...buttonProps
    },
    ref,
  ) {
    return (
      <button
        {...buttonProps}
        {...visualAttributes(elevation, selected)}
        ref={ref}
        type={type}
        className={joinClassNames("gummy-card gummy-card--interactive", className)}
        data-interactive="button"
      >
        <CardFrame />
        {children}
      </button>
    );
  },
);

GummyCardButton.displayName = "GummyCardButton";

export const GummyCardIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyCardIcon({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-card__icon", className)} />;
});

GummyCardIcon.displayName = "GummyCardIcon";

export const GummyCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyCardHeader({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-card__header", className)} />;
});

GummyCardHeader.displayName = "GummyCardHeader";

export const GummyCardTitle = React.forwardRef<
  HTMLHeadingElement,
  GummyCardTitleProps
>(function GummyCardTitle({ className, level = 3, ...props }, ref) {
  const Heading = `h${level}` as const;
  return React.createElement(Heading, {
    ...props,
    ref,
    className: joinClassNames("gummy-card__title", className),
  });
});

GummyCardTitle.displayName = "GummyCardTitle";

export const GummyCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function GummyCardDescription({ className, ...props }, ref) {
  return <p {...props} ref={ref} className={joinClassNames("gummy-card__description", className)} />;
});

GummyCardDescription.displayName = "GummyCardDescription";

export const GummyCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyCardContent({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-card__content", className)} />;
});

GummyCardContent.displayName = "GummyCardContent";

export const GummyCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyCardFooter({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-card__footer", className)} />;
});

GummyCardFooter.displayName = "GummyCardFooter";
