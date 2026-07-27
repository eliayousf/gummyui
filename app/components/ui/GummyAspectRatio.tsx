import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyAspectRatioProps = React.HTMLAttributes<HTMLDivElement> & {
  ratio?: number;
  fit?: "cover" | "contain" | "fill";
};

export const GummyAspectRatio = React.forwardRef<
  HTMLDivElement,
  GummyAspectRatioProps
>(function GummyAspectRatio(
  {
    ratio = 16 / 9,
    fit = "cover",
    className,
    style,
    children,
    ...ratioProps
  },
  ref,
) {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;
  return (
    <div
      {...ratioProps}
      ref={ref}
      className={joinClassNames("gummy-aspect-ratio", className)}
      data-fit={fit}
      style={{ ...style, aspectRatio: safeRatio }}
    >
      <div className="gummy-aspect-ratio__content">{children}</div>
    </div>
  );
});

GummyAspectRatio.displayName = "GummyAspectRatio";
