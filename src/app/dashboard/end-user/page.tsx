
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, PlusCircle, Ticket as TicketIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Ticket } from "@/lib/mock-data";


export default function EndUserDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({ open: 0, resolved: 0 });
    const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (authLoading || !user?.email) {
            if (!authLoading) setLoading(false);
            return;
        }

        const baseQuery = query(collection(db, "tickets"), where('createdBy', '==', user.email));

        const unsubscribeAll = onSnapshot(baseQuery, (snapshot) => {
            let openCount = 0;
            let resolvedCount = 0;
            snapshot.forEach(doc => {
                const ticket = doc.data() as Ticket;
                if (ticket.status === 'Resolved') {
                    resolvedCount++;
                } else {
                    openCount++;
                }
            });
            setStats({ open: openCount, resolved: resolvedCount });
            setLoading(false);
        });

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
            unsubscribeAll();
            unsubscribeRecent();
        };

    }, [user, authLoading]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Dashboard</CardTitle>
          <CardDescription>Welcome to your HelpDeck dashboard, {user?.email || 'User'}.</CardDescription>
        </CardHeader>
         <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
                <Button asChild variant="outline" size="lg" className="h-auto py-6">
                     <Link href="/dashboard/end-user/new">
                        <div className="flex items-center gap-4">
                            <PlusCircle className="h-8 w-8 text-primary" />
                            <div>
                                <p className="font-semibold text-lg">Create New Ticket</p>
                                <p className="text-sm text-muted-foreground text-left">Need help? Submit a new request.</p>
                            </div>
                        </div>
                    </Link>
                </Button>
                 <Button asChild variant="outline" size="lg" className="h-auto py-6">
                     <Link href="/dashboard/end-user/my-tickets">
                        <div className="flex items-center gap-4">
                            <TicketIcon className="h-8 w-8 text-primary" />
                            <div>
                                <p className="font-semibold text-lg">View My Tickets</p>
                                <p className="text-sm text-muted-foreground text-left">Check the status of your existing tickets.</p>
                            </div>
                        </div>
                    </Link>
                </Button>
            </div>
        </CardContent>
      </Card>
      
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                    <TicketIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{stats.open}</div>}
                    <p className="text-xs text-muted-foreground">
                        Tickets currently being worked on.
                    </p>
                </CardContent>
             </Card>
             <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Resolved Tickets</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{stats.resolved}</div>}
                     <p className="text-xs text-muted-foreground">
                        Tickets that have been successfully closed.
                    </p>
                </CardContent>
             </Card>
        </div>


        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Recent Activity</CardTitle>
                <CardDescription>Your most recently updated tickets.</CardDescription>
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
                        <p className="text-muted-foreground">You have no ticket activity yet.</p>
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
                                        <Link href={`/dashboard/end-user/tickets/${ticket.id}`} className="font-medium hover:underline">
                                            {ticket.subject}
                                        </Link>
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
             {recentTickets.length > 0 && (
                <CardFooter>
                    <Button asChild className="ml-auto" variant="secondary">
                        <Link href="/dashboard/end-user/my-tickets">
                            View All
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
             )}
        </Card>

    </div>
  );
}
