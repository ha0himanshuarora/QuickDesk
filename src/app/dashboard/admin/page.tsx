
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRoleChart } from "@/components/user-role-chart";
import { TicketStatusChart } from "@/components/ticket-status-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type UserData = {
  role: string;
};

type TicketData = {
  status: string;
};

export default function AdminDashboardPage() {
  const [userRoleData, setUserRoleData] = useState<{ name: string; value: number }[]>([]);
  const [ticketStatusData, setTicketStatusData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const rolesCount: Record<string, number> = { "Admin": 0, "Support Agent": 0, "End-User": 0 };
      snapshot.forEach(doc => {
        const user = doc.data() as UserData;
        if (user.role in rolesCount) {
          rolesCount[user.role]++;
        }
      });
      setUserRoleData([
        { name: "Admins", value: rolesCount["Admin"] },
        { name: "Support Agents", value: rolesCount["Support Agent"] },
        { name: "End-Users", value: rolesCount["End-User"] },
      ]);
      setLoading(false);
    });

    const ticketsUnsubscribe = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const statusCount: Record<string, number> = { "Open": 0, "In Progress": 0, "Resolved": 0 };
        snapshot.forEach(doc => {
            const ticket = doc.data() as TicketData;
            if (ticket.status in statusCount) {
            statusCount[ticket.status]++;
            }
        });
      setTicketStatusData([
        { name: "Open", value: statusCount["Open"] },
        { name: "In Progress", value: statusCount["In Progress"] },
        { name: "Resolved", value: statusCount["Resolved"] },
      ]);
       setLoading(false);
    });


    return () => {
      usersUnsubscribe();
      ticketsUnsubscribe();
    };
  }, []);

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Admin Dashboard</CardTitle>
          <CardDescription>An overview of your QuickDesk instance.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">User Roles</CardTitle>
            <CardDescription>Distribution of users by their assigned role.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : <UserRoleChart data={userRoleData} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Ticket Statuses</CardTitle>
            <CardDescription>Current status of all tickets in the system.</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-[300px] w-full" /> : <TicketStatusChart data={ticketStatusData} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
