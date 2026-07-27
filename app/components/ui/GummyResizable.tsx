"use client";

import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ResizableContextValue = {
  orientation: "horizontal" | "vertical";
  direction: "ltr" | "rtl";
  size: number;
  minSize: number;
  maxSize: number;
  rootRef: React.RefObject<HTMLDivElement | null>;
  setSize: (value: number) => void;
};

const ResizableContext = React.createContext<ResizableContextValue | null>(null);

function useResizable() {
  const context = React.useContext(ResizableContext);
  if (!context) throw new Error("Gummy Resizable parts must be used inside GummyResizablePanelGroup.");
  return context;
}

export type GummyResizablePanelGroupProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "dir"
> & {
  orientation?: "horizontal" | "vertical";
  direction?: "ltr" | "rtl";
  size?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onSizeChange?: (size: number) => void;
};

export const GummyResizablePanelGroup = React.forwardRef<
  HTMLDivElement,
  GummyResizablePanelGroupProps
>(function GummyResizablePanelGroup(
  {
    orientation = "horizontal",
    direction = "ltr",
    size: controlledSize,
    defaultSize = 50,
    minSize = 20,
    maxSize = 80,
    onSizeChange,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const safeMin = Math.max(0, Math.min(minSize, 95));
  const safeMax = Math.max(safeMin, Math.min(maxSize, 100));
  const clamp = React.useCallback(
    (value: number) => Math.min(safeMax, Math.max(safeMin, value)),
    [safeMax, safeMin],
  );
  const [internalSize, setInternalSize] = React.useState(() => clamp(defaultSize));
  const currentSize = clamp(controlledSize ?? internalSize);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const setSize = React.useCallback(
    (next: number) => {
      const clamped = clamp(next);
      if (controlledSize === undefined) setInternalSize(clamped);
      onSizeChange?.(clamped);
    },
    [clamp, controlledSize, onSizeChange],
  );
  const context = React.useMemo(
    () => ({
      orientation,
      direction,
      size: currentSize,
      minSize: safeMin,
      maxSize: safeMax,
      rootRef,
      setSize,
    }),
    [currentSize, direction, orientation, safeMax, safeMin, setSize],
  );
  return (
    <ResizableContext.Provider value={context}>
      <div
        {...props}
        ref={setRootRef}
        dir={direction}
        className={joinClassNames("gummy-resizable", className)}
        data-orientation={orientation}
        style={{ ...style, "--gummy-resizable-size": `${currentSize}%` } as React.CSSProperties}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  );
});

export type GummyResizablePanelProps = React.HTMLAttributes<HTMLDivElement> & {
  order: "first" | "second";
};

export const GummyResizablePanel = React.forwardRef<HTMLDivElement, GummyResizablePanelProps>(
  function GummyResizablePanel({ order, className, ...props }, ref) {
    useResizable();
    return (
      <div
        {...props}
        ref={ref}
        className={joinClassNames("gummy-resizable__panel", className)}
        data-order={order}
      />
    );
  },
);

export type GummyResizableHandleProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
  step?: number;
};

export const GummyResizableHandle = React.forwardRef<HTMLDivElement, GummyResizableHandleProps>(
  function GummyResizableHandle(
    { label = "Resize panels", step = 2, className, onKeyDown, onPointerDown, onPointerMove, onPointerUp, ...props },
    ref,
  ) {
    const context = useResizable();
    const dragging = React.useRef(false);

    function updateFromPointer(event: React.PointerEvent<HTMLDivElement>) {
      const bounds = context.rootRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const raw = context.orientation === "horizontal"
        ? ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 100
        : ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 100;
      context.setSize(
        context.orientation === "horizontal" && context.direction === "rtl" ? 100 - raw : raw,
      );
    }

    return (
      <div
        {...props}
        ref={ref}
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={context.orientation}
        aria-valuemin={context.minSize}
        aria-valuemax={context.maxSize}
        aria-valuenow={Math.round(context.size)}
        className={joinClassNames("gummy-resizable__handle", className)}
        data-orientation={context.orientation}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented) return;
          dragging.current = true;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          if (dragging.current && !event.defaultPrevented) updateFromPointer(event);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          dragging.current = false;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const amount = event.shiftKey ? step * 5 : step;
          let delta = 0;
          if (context.orientation === "horizontal") {
            if (event.key === "ArrowLeft") delta = context.direction === "rtl" ? amount : -amount;
            if (event.key === "ArrowRight") delta = context.direction === "rtl" ? -amount : amount;
          } else {
            if (event.key === "ArrowUp") delta = -amount;
            if (event.key === "ArrowDown") delta = amount;
          }
          if (event.key === "Home") {
            event.preventDefault();
            context.setSize(context.minSize);
          } else if (event.key === "End") {
            event.preventDefault();
            context.setSize(context.maxSize);
          } else if (delta) {
            event.preventDefault();
            context.setSize(context.size + delta);
          }
        }}
      >
        <span aria-hidden="true">⋮</span>
      </div>
    );
  },
);

export const GummyResizable = GummyResizablePanelGroup;

GummyResizablePanelGroup.displayName = "GummyResizablePanelGroup";
GummyResizablePanel.displayName = "GummyResizablePanel";
GummyResizableHandle.displayName = "GummyResizableHandle";
