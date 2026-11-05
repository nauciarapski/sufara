import * as React from "react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs animate-in fade-in" onClick={() => onOpenChange && onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg">{children}</div>
    </div>
  );
}

export function DialogTrigger({ children, onClick, ...props }) {
  return React.isValidElement(children) ? React.cloneElement(children, { onClick, ...props }) : children;
}

export const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("relative rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 duration-200 animate-in zoom-in-95", className)} {...props}>
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

export const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-bold leading-none tracking-tight text-slate-900 font-display", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-slate-500", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";
export default Dialog;