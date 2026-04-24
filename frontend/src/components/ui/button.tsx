import { ButtonHTMLAttributes } from "react";

const variants: Record<string, string> = {
  default: "bg-purple-600 text-white hover:bg-purple-700",
  outline: "border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
  ghost:   "text-gray-500 hover:bg-gray-100",
  danger:  "bg-red-500 text-white hover:bg-red-600",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
}

export function Button({ variant = "default", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
