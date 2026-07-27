"use client";

import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyAvatarProps = React.HTMLAttributes<HTMLSpanElement> & {
  src?: string;
  alt?: string;
  fallback: React.ReactNode;
  size?: "small" | "medium" | "large";
  status?: "online" | "busy" | "away" | "offline";
  statusLabel?: string;
};

export const GummyAvatar = React.forwardRef<HTMLSpanElement, GummyAvatarProps>(
  function GummyAvatar(
    {
      src,
      alt = "",
      fallback,
      size = "medium",
      status,
      statusLabel,
      className,
      ...avatarProps
    },
    ref,
  ) {
    const [failed, setFailed] = React.useState(false);
    const showImage = Boolean(src) && !failed;
    return (
      <span
        {...avatarProps}
        ref={ref}
        className={joinClassNames("gummy-avatar", className)}
        data-size={size}
        data-status={status}
      >
        <span className="gummy-avatar__media">
          {showImage ? (
            // The caller owns remote-image policy and dimensions.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} onError={() => setFailed(true)} />
          ) : (
            <span className="gummy-avatar__fallback" aria-hidden={Boolean(alt)}>
              {fallback}
            </span>
          )}
        </span>
        {status ? (
          <span
            className="gummy-avatar__status"
            aria-label={statusLabel ?? status}
            role="img"
          />
        ) : null}
      </span>
    );
  },
);

GummyAvatar.displayName = "GummyAvatar";

export type GummyAvatarGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
};

export const GummyAvatarGroup = React.forwardRef<
  HTMLDivElement,
  GummyAvatarGroupProps
>(function GummyAvatarGroup({ label, className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={joinClassNames("gummy-avatar-group", className)}
      role="group"
      aria-label={label}
    />
  );
});

GummyAvatarGroup.displayName = "GummyAvatarGroup";
