import { LabelHTMLAttributes } from "react";

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`text-sm font-medium text-gray-700 ${className}`}
    />
  );
}
