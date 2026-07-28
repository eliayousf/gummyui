"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyDialog = Dialog.Root;

export type GummyDialogPortalProps = React.ComponentPropsWithoutRef<
  typeof Dialog.Portal
> & { keepMounted?: boolean };

export function GummyDialogPortal({
  keepMounted,
  ...props
}: GummyDialogPortalProps) {
  void keepMounted;
  return <Dialog.Portal {...props} />;
}

export const GummyDialogTrigger = React.forwardRef<
  React.ElementRef<typeof Dialog.Trigger>,
  React.ComponentPropsWithoutRef<typeof Dialog.Trigger>
>(function GummyDialogTrigger({ className, children, ...props }, ref) {
  return (
    <Dialog.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-dialog__trigger", className)}
    >
      <span className="gummy-dialog__trigger-copy">{children}</span>
      <span className="gummy-dialog__trigger-pool" aria-hidden="true" />
    </Dialog.Trigger>
  );
});

export const GummyDialogBackdrop = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(function GummyDialogBackdrop({ className, ...props }, ref) {
  return (
    <Dialog.Overlay
      {...props}
      ref={ref}
      className={joinClassNames("gummy-dialog__backdrop", className)}
    />
  );
});

export const GummyDialogViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyDialogViewport({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={joinClassNames("gummy-dialog__viewport", className)}
    />
  );
});

export const GummyDialogPopup = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(function GummyDialogPopup({ className, children, ...props }, ref) {
  return (
    <Dialog.Content
      {...props}
      ref={ref}
      className={joinClassNames("gummy-dialog__popup", className)}
    >
      <span className="gummy-dialog__reservoir gummy-dialog__reservoir--start" aria-hidden="true" />
      <span className="gummy-dialog__reservoir gummy-dialog__reservoir--end" aria-hidden="true" />
      <div className="gummy-dialog__plane">{children}</div>
    </Dialog.Content>
  );
});

export const GummyDialogTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(function GummyDialogTitle({ className, ...props }, ref) {
  return (
    <Dialog.Title
      {...props}
      ref={ref}
      className={joinClassNames("gummy-dialog__title", className)}
    />
  );
});

export const GummyDialogDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(function GummyDialogDescription({ className, ...props }, ref) {
  return (
    <Dialog.Description
      {...props}
      ref={ref}
      className={joinClassNames("gummy-dialog__description", className)}
    />
  );
});

export const GummyDialogClose = React.forwardRef<
  React.ElementRef<typeof Dialog.Close>,
  React.ComponentPropsWithoutRef<typeof Dialog.Close>
>(function GummyDialogClose({ className, ...props }, ref) {
  return (
    <Dialog.Close
      {...props}
      ref={ref}
      className={joinClassNames("gummy-dialog__close", className)}
    />
  );
});

export function GummyDialogSurface({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      aria-hidden="true"
      className={joinClassNames(
        "gummy-dialog__popup",
        "gummy-dialog__popup--preview",
        className,
      )}
    >
      <span className="gummy-dialog__reservoir gummy-dialog__reservoir--start" aria-hidden="true" />
      <span className="gummy-dialog__reservoir gummy-dialog__reservoir--end" aria-hidden="true" />
      <div className="gummy-dialog__plane">{children}</div>
    </div>
  );
}

GummyDialogTrigger.displayName = "GummyDialogTrigger";
GummyDialogBackdrop.displayName = "GummyDialogBackdrop";
GummyDialogViewport.displayName = "GummyDialogViewport";
GummyDialogPopup.displayName = "GummyDialogPopup";
GummyDialogTitle.displayName = "GummyDialogTitle";
GummyDialogDescription.displayName = "GummyDialogDescription";
GummyDialogClose.displayName = "GummyDialogClose";
