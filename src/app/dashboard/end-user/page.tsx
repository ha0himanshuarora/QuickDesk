
"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, PlusCircle, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ticket } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading || !user) {
            setTickets([]);
            return;
        };

        let q;
        const baseQuery = query(collection(db, 'tickets'), where('createdBy', '==', user.email));
        
        if (statusFilter === 'All') {
            q = baseQuery;
        } else {
            q = query(baseQuery, where('status', '==', statusFilter));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                 } as Ticket
            });
            setTickets(ticketsData);
        });
        return () => unsubscribe();
    }, [statusFilter, user, loading]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">My Tickets</h1>
            <p className="text-muted-foreground">Manage and respond to user queries.</p>
        </div>
        <Link href="/dashboard/end-user/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" onValueChange={(value) => setStatusFilter(value.charAt(0).toUpperCase() + value.slice(1))}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickets..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
        </div>
        <TabsContent value={statusFilter.toLowerCase()} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Priority</TableHead>
                    <TableHead className="text-right">
                        <Button variant="ghost" size="sm">
                            Last Updated
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading tickets...</TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">You have not created any tickets yet.</TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell>
                            <Link href={`/dashboard/end-user/tickets/${ticket.id}`} className="font-medium text-foreground hover:underline">
                                {ticket.subject}
                            </Link>
                            <div className="text-sm text-muted-foreground hidden sm:block">{ticket.createdBy}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{ticket.category}</Badge>
                            </TableCell>
                            <TableCell>
                            <TicketStatusBadge status={ticket.status} />
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                            <Badge variant={ticket.priority === 'High' ? 'destructive' : ticket.priority === 'Medium' ? 'default' : 'outline'} className="capitalize">{ticket.priority.toLowerCase()}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                        </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
