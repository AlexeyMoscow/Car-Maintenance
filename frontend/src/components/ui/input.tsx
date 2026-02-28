import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-[#2A2A2A] bg-[#101010] px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#6E6E6E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCD00]/40",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
