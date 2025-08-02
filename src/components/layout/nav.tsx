"use client";

import { Home, Ticket, PlusSquare, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const allLinks = {
    "Admin": [
        { href: "/dashboard/admin", label: "Dashboard" },
        // Add other admin links here
    ],
    "Support Agent": [
        { href: "/dashboard/support-agent", label: "Tickets" },
        // Add other agent links here
    ],
    "End-User": [
        { href: "/dashboard/end-user", label: "My Tickets" },
        { href: "/dashboard/end-user/new", label: "New Ticket" },
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
      {links.map((link) => (
        <Link 
            key={link.href} 
            href={link.href}
            className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith(link.href) ? "text-primary" : "text-muted-foreground"
            )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
