import * as React from "react";
import { cn } from "@/lib/utils";

export const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full shadow-2xs", className)} {...props} />
));
Avatar.displayName = "Avatar";

export const AvatarImage = React.forwardRef(({ className, src, alt = "", ...props }, ref) => {
  const [hasError, setHasError] = React.useState(!src);
  if (hasError) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700", className)} {...props} />
));
AvatarFallback.displayName = "AvatarFallback";
export default Avatar;