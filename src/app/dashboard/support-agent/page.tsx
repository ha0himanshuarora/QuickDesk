
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { TicketStatusChart } from "@/components/ticket-status-chart";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, Timestamp, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";


export default function SupportAgentDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [ticketStatusData, setTicketStatusData] = useState<{ name: string; value: number }[]>([]);
    const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !user?.email) {
            if (!authLoading) setLoading(false);
            return;
        }

        const baseQuery = query(collection(db, "tickets"), where('agent', '==', user.email));

        // For the chart
        const unsubscribeChart = onSnapshot(baseQuery, (snapshot) => {
            const statusCount: Record<string, number> = { "Open": 0, "In Progress": 0, "Resolved": 0 };
            snapshot.forEach(doc => {
                const ticket = doc.data() as Ticket;
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

        // For the recent tickets list
        const recentTicketsQuery = query(baseQuery, orderBy("updatedAt", "desc"), limit(3));
        const unsubscribeRecent = onSnapshot(recentTicketsQuery, (snapshot) => {
             const ticketsData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                 } as Ticket
            });
            setRecentTickets(ticketsData);
        });


        return () => {
            unsubscribeChart();
            unsubscribeRecent();
        };

    }, [user, authLoading]);

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Support Dashboard</CardTitle>
          <CardDescription>Welcome, Support Agent! Here's your overview.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">My Ticket Statuses</CardTitle>
            <CardDescription>Current status of your assigned tickets.</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-[300px] w-full" /> : <TicketStatusChart data={ticketStatusData} />}
          </CardContent>
        </Card>
         <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline">Recently Updated Tickets</CardTitle>
                <CardDescription>Your most recently updated assigned tickets.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : recentTickets.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-muted-foreground">You have no assigned tickets.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTickets.map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell>
                                        <Link href={`/dashboard/support-agent/tickets/${ticket.id}`} className="font-medium hover:underline">
                                            {ticket.subject}
                                        </Link>
                                        <div className="text-sm text-muted-foreground">{ticket.createdBy}</div>
                                    </TableCell>
                                    <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {new Date(ticket.updatedAt as string).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            <CardFooter>
                <Button asChild className="ml-auto">
                    <Link href="/dashboard/support-agent/tickets?tab=my">
                        View all my tickets
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
