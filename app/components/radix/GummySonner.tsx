"use client";

import * as Toast from "@radix-ui/react-toast";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyToastInput = {
  title: React.ReactNode;
  description?: React.ReactNode;
  type?: "default" | "success" | "warning" | "error";
  duration?: number;
};

type GummyToastRecord = GummyToastInput & { id: number; open: boolean };
type ToastManager = {
  add: (toast: GummyToastInput) => number;
  dismiss: (id: number) => void;
  toasts: readonly GummyToastRecord[];
};

const ToastManagerContext = React.createContext<ToastManager | null>(null);

export type GummySonnerProviderProps = React.PropsWithChildren<{
  timeout?: number;
  limit?: number;
  swipeDirection?: React.ComponentPropsWithoutRef<typeof Toast.Provider>["swipeDirection"];
}>;

export function GummySonnerProvider({
  timeout = 5000,
  limit = 3,
  children,
  ...props
}: GummySonnerProviderProps) {
  const nextId = React.useRef(0);
  const [toasts, setToasts] = React.useState<GummyToastRecord[]>([]);
  const manager = React.useMemo<ToastManager>(() => ({
    add(input) {
      const id = ++nextId.current;
      setToasts((current) => [
        ...current.slice(-(Math.max(1, limit) - 1)),
        { ...input, id, open: true },
      ]);
      return id;
    },
    dismiss(id) {
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id ? { ...toast, open: false } : toast,
        ),
      );
    },
    toasts,
  }), [limit, toasts]);
  return (
    <ToastManagerContext.Provider value={manager}>
      <Toast.Provider {...props} duration={timeout}>{children}</Toast.Provider>
    </ToastManagerContext.Provider>
  );
}

export function useGummyToast() {
  const manager = React.useContext(ToastManagerContext);
  if (!manager) {
    throw new Error("useGummyToast must be used inside GummySonnerProvider.");
  }
  return manager;
}

export type GummyToasterProps =
  React.ComponentPropsWithoutRef<typeof Toast.Viewport> & {
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    closeLabel?: string;
  };

export const GummyToaster = React.forwardRef<
  React.ElementRef<typeof Toast.Viewport>,
  GummyToasterProps
>(function GummyToaster(
  {
    position = "bottom-right",
    closeLabel = "Dismiss notification",
    className,
    ...props
  },
  ref,
) {
  const manager = useGummyToast();
  return (
    <>
      {manager.toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          open={toast.open}
          onOpenChange={(open) => {
            if (!open) manager.dismiss(toast.id);
          }}
          duration={toast.duration}
          className="gummy-toast"
          data-type={toast.type}
        >
          <div className="gummy-toast__content">
            <span className="gummy-toast__reservoir" aria-hidden="true" />
            <div className="gummy-toast__copy">
              <Toast.Title className="gummy-toast__title">{toast.title}</Toast.Title>
              {toast.description ? (
                <Toast.Description className="gummy-toast__description">
                  {toast.description}
                </Toast.Description>
              ) : null}
            </div>
            <Toast.Close className="gummy-toast__close" aria-label={closeLabel}>
              <span aria-hidden="true">×</span>
            </Toast.Close>
          </div>
        </Toast.Root>
      ))}
      <Toast.Viewport
        {...props}
        ref={ref}
        className={joinClassNames("gummy-toaster", className)}
        data-position={position}
      />
    </>
  );
});

GummyToaster.displayName = "GummyToaster";
