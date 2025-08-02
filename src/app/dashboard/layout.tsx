
"use client";
import type { PropsWithChildren } from "react";
import { Header } from "@/components/layout/header";
import { Nav } from "@/components/layout/nav";
import { UserNav } from "@/components/layout/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";


export default function DashboardLayout({ children }: PropsWithChildren) {

  return (
      <div className="flex flex-col min-h-screen">
        <Header className="bg-background/80 backdrop-blur-lg border-gray-500/50">
            <div className="flex items-center gap-4">
               <Link href="/dashboard" className="flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-8 h-8 text-primary"
                    >
                        <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                        <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                    </svg>
                    <h1 className="text-xl font-semibold font-headline">HelpDeck</h1>
               </Link>
            </div>

            <div className="ml-auto flex items-center gap-6">
                <div className="hidden md:flex">
                  <Nav />
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <UserNav />
                </div>
            </div>
          </Header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
  );
}
