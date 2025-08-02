
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const allLinks = {
    "Admin": [
        { href: "/dashboard/admin", label: "Dashboard", exact: true },
        { href: "/dashboard/admin/role-management", label: "Role Management" },
    ],
    "Support Agent": [
        { href: "/dashboard/support-agent", label: "Dashboard", exact: true },
        { href: "/dashboard/support-agent/tickets", label: "All Tickets" },
        { href: "/dashboard/end-user/new", label: "New Ticket" },
        { href: "/dashboard/end-user/knowledge-base", label: "Community Tickets" },
    ],
    "End-User": [
        { href: "/dashboard/end-user", label: "Dashboard", exact: true },
        { href: "/dashboard/end-user/my-tickets", label: "My Tickets" },
        { href: "/dashboard/end-user/new", label: "New Ticket" },
        { href: "/dashboard/end-user/knowledge-base", label: "Community Tickets" },
    ]
};

export function Nav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<keyof typeof allLinks | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  const links = userRole ? allLinks[userRole] : [];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
            <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                )}
            >
            {link.label}
            </Link>
        )
      })}
    </nav>
  );
}
