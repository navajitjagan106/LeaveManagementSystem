import { ReactNode } from "react";

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}
