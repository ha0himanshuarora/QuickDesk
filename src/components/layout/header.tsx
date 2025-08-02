import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function Header({ children, className }: PropsWithChildren<{className?: string}>) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </header>
  );
}
