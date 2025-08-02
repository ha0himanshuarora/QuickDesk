import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function Header({ children, className }: PropsWithChildren<{className?: string}>) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between space-x-4 sm:space-x-0">
        {children}
      </div>
    </header>
  );
}
