import * as React from "react";
import { cn } from "@/lib/utils";

export const Separator = React.forwardRef(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shrink-0 bg-slate-200/80",
      orientation === "horizontal" ? "h-[1px] w-full my-2" : "h-full w-[1px] mx-2",
      className
    )}
    {...props}
  />
));
Separator.displayName = "Separator";
export default Separator;