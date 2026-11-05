import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-2xl border border-slate-200/80 shadow-2xs">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b bg-slate-50/75 border-slate-200", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0 divide-y divide-slate-100", className)} {...props} />
));
TableBody.displayName = "TableBody";

export const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn("border-t bg-slate-100/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
));
TableFooter.displayName = "TableFooter";

export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-slate-100 transition-colors hover:bg-slate-50/60 data-[state=selected]:bg-slate-100", className)} {...props} />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-11 px-4 text-left align-middle font-bold text-xs uppercase tracking-wider text-slate-500", className)} {...props} />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle text-slate-700", className)} {...props} />
));
TableCell.displayName = "TableCell";

export const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-xs text-slate-500", className)} {...props} />
));
TableCaption.displayName = "TableCaption";
export default Table;