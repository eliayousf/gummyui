"use client";

import { Toast } from "@base-ui/react/toast";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummySonnerProviderProps = Toast.Provider.Props;

export function GummySonnerProvider({
  timeout = 5000,
  limit = 3,
  ...props
}: GummySonnerProviderProps) {
  return <Toast.Provider {...props} timeout={timeout} limit={limit} />;
}

export function useGummyToast() {
  return Toast.useToastManager();
}

export type GummyToasterProps = Omit<Toast.Viewport.Props, "children"> & {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  closeLabel?: string;
};

export const GummyToaster = React.forwardRef<HTMLDivElement, GummyToasterProps>(
  function GummyToaster(
    {
      position = "bottom-right",
      closeLabel = "Dismiss notification",
      className,
      ...props
    },
    ref,
  ) {
    const { toasts } = Toast.useToastManager();
    return (
      <Toast.Portal>
        <Toast.Viewport
          {...props}
          ref={ref}
          className={joinClassNames("gummy-toaster", className as string)}
          data-position={position}
        >
          {toasts.map((toast) => (
            <Toast.Root
              key={toast.id}
              toast={toast}
              className="gummy-toast"
              swipeDirection={position.endsWith("right") ? "right" : "left"}
            >
              <Toast.Content className="gummy-toast__content">
                <span className="gummy-toast__reservoir" aria-hidden="true" />
                <div className="gummy-toast__copy">
                  <Toast.Title className="gummy-toast__title" />
                  <Toast.Description className="gummy-toast__description" />
                </div>
                {toast.actionProps ? (
                  <Toast.Action {...toast.actionProps} className={joinClassNames("gummy-toast__action", toast.actionProps.className)}>
                    {toast.actionProps.children}
                  </Toast.Action>
                ) : null}
                <Toast.Close className="gummy-toast__close" aria-label={closeLabel}>
                  <span aria-hidden="true">×</span>
                </Toast.Close>
              </Toast.Content>
            </Toast.Root>
          ))}
        </Toast.Viewport>
      </Toast.Portal>
    );
  },
);

GummyToaster.displayName = "GummyToaster";
