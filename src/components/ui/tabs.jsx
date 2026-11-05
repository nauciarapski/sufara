import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext({ value: "", onValueChange: (v) => {} });

export function Tabs({ value, defaultValue, onValueChange, className, children, ...props }) {
  const [currentVal, setCurrentVal] = React.useState(value || defaultValue || "");
  const active = value !== undefined ? value : currentVal;
  const change = (v) => {
    setCurrentVal(v);
    if (onValueChange) onValueChange(v);
  };
  return (
    <TabsContext.Provider value={{ value: active, onValueChange: change }}>
      <div className={cn("space-y-4", className)} {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 p-1 text-slate-500", className)} {...props} />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef(({ className, value, children, ...props }, ref) => {
  const ctx = React.useContext(TabsContext);
  const isSelected = ctx.value === value;
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ring-offset-white transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        isSelected ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef(({ className, value, children, ...props }, ref) => {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <div ref={ref} className={cn("mt-2 ring-offset-white focus-visible:outline-none animate-in fade-in duration-150", className)} {...props}>
      {children}
    </div>
  );
});
TabsContent.displayName = "TabsContent";
export default Tabs;