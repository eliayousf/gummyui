import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyKbdProps = React.HTMLAttributes<HTMLElement>;

export const GummyKbd = React.forwardRef<HTMLElement, GummyKbdProps>(
  function GummyKbd({ className, ...kbdProps }, ref) {
    return (
      <kbd
        {...kbdProps}
        ref={ref}
        className={joinClassNames("gummy-kbd", className)}
      />
    );
  },
);

GummyKbd.displayName = "GummyKbd";

export type GummyKbdGroupProps = React.HTMLAttributes<HTMLSpanElement> & {
  separator?: React.ReactNode;
};

export const GummyKbdGroup = React.forwardRef<
  HTMLSpanElement,
  GummyKbdGroupProps
>(function GummyKbdGroup(
  { separator = "+", className, children, ...groupProps },
  ref,
) {
  const keys = React.Children.toArray(children);

  return (
    <span
      {...groupProps}
      ref={ref}
      className={joinClassNames("gummy-kbd-group", className)}
    >
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <span className="gummy-kbd-group__separator" aria-hidden="true">
              {separator}
            </span>
          ) : null}
          {key}
        </React.Fragment>
      ))}
    </span>
  );
});

GummyKbdGroup.displayName = "GummyKbdGroup";
