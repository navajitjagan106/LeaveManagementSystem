import { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function Field({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}

export function FieldLabel({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center w-full", className)}>
      {children}
    </label>
  );
}
