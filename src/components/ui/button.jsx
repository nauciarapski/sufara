import * as React from "react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
  const variants = {
    default: "bg-slate-900 text-white shadow-sm hover:bg-slate-800 border border-slate-800",
    destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-500",
    outline: "border border-slate-300 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-slate-900",
    secondary: "bg-slate-100 text-slate-900 shadow-2xs hover:bg-slate-200/80",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
    link: "text-slate-900 underline-offset-4 hover:underline",
  };
  const sizes = {
    default: "h-10 px-4 py-2 gap-2",
    sm: "h-8 rounded-lg px-3 text-xs gap-1.5",
    lg: "h-11 rounded-xl px-8 text-base gap-2",
    icon: "h-9 w-9 p-0",
  };
  return <button className={cn(base, variants[variant] || variants.default, sizes[size] || sizes.default, className)} ref={ref} {...props} />;
});
Button.displayName = "Button";
export default Button;