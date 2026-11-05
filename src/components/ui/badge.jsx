import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";
  const variants = {
    default: "bg-slate-900 text-slate-50 shadow-2xs hover:bg-slate-800",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200/80",
    destructive: "bg-rose-100 text-rose-700 hover:bg-rose-200/80",
    outline: "border border-slate-200 text-slate-950 hover:bg-slate-100/50",
    success: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80",
  };
  return <div className={cn(base, variants[variant] || variants.default, className)} {...props} />;
}
export default Badge;