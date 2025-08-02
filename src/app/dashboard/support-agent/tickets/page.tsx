
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
import { Search, PlusCircle } from "lucide-react";
import Link from "next/link";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ticket } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { DataTablePagination } from "@/components/data-table-pagination";

export default function SupportAgentTicketsPage() {
    const [allTickets, setAllTickets] = useState<Ticket[]>([]);
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const filteredAllTickets = useMemo(() => {
        return allTickets.filter(ticket =>
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allTickets, searchTerm]);

    const filteredMyTickets = useMemo(() => {
        return myTickets.filter(ticket =>
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [myTickets, searchTerm]);

    const ticketsToPaginate = activeTab === 'all' ? filteredAllTickets : filteredMyTickets;
    const paginatedTickets = ticketsToPaginate.slice((page - 1) * perPage, page * perPage);
    const pageCount = Math.ceil(ticketsToPaginate.length / perPage);

    useEffect(() => {
        if (authLoading) return;
        setLoading(true);

        const ticketsCollection = collection(db, 'tickets');
        
        const allQuery = query(ticketsCollection);
        const unsubscribeAll = onSnapshot(allQuery, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                 } as Ticket
            });
            setAllTickets(ticketsData);
             setLoading(false);
        });

        let unsubscribeMy;
        if (user?.email) {
            const myQuery = query(ticketsCollection, where('agent', '==', user.email));
            unsubscribeMy = onSnapshot(myQuery, (snapshot) => {
                 const ticketsData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    } as Ticket
                });
                setMyTickets(ticketsData);
                if (activeTab === "my") setLoading(false);
            });
        }
        
        return () => {
            unsubscribeAll();
            if (unsubscribeMy) unsubscribeMy();
        };

    }, [user, authLoading, activeTab]);
    
    useEffect(() => {
      setPage(1);
    }, [activeTab, searchTerm]);

    const renderTicketTable = (tickets: Ticket[], emptyMessage: string) => (
         <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="hidden md:table-cell">Requester</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Priority</TableHead>
                        <TableHead className="hidden lg:table-cell">Agent</TableHead>
                        <TableHead className="text-right">Last Updated</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">Loading tickets...</TableCell>
                        </TableRow>
                    ) : tickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">{searchTerm ? "No tickets match your search." : emptyMessage}</TableCell>
                        </TableRow>
                    ) : (
                        tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                                <TableCell>
                                <Link href={`/dashboard/support-agent/tickets/${ticket.id}`} className="font-medium text-foreground hover:underline">
                                    {ticket.subject}
                                </Link>
                                <div className="text-sm text-muted-foreground hidden sm:block">{ticket.category}</div>
                                </TableCell>
                                 <TableCell className="hidden md:table-cell">
                                    {ticket.createdBy}
                                </TableCell>
                                <TableCell>
                                <TicketStatusBadge status={ticket.status} />
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                <Badge variant={ticket.priority === 'High' ? 'destructive' : ticket.priority === 'Medium' ? 'default' : 'outline'} className="capitalize">{ticket.priority.toLowerCase()}</Badge>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <Badge variant="secondary">{ticket.agent}</Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
                 {pageCount > 0 && (
                    <DataTablePagination 
                        page={page} 
                        pageCount={pageCount} 
                        perPage={perPage} 
                        setPage={setPage} 
                        setPerPage={setPerPage}
                    />
                )}
            </CardContent>
        </Card>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">Ticket Queues</h1>
            <p className="text-muted-foreground">Manage and respond to user queries.</p>
        </div>
        <Link href="/dashboard/end-user/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" onValueChange={(value) => { setLoading(true); setActiveTab(value); }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="all">All Tickets</TabsTrigger>
            <TabsTrigger value="my">My Assigned Tickets</TabsTrigger>
          </TabsList>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickets..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <TabsContent value="all" className="mt-4">
            {renderTicketTable(paginatedTickets, "No tickets found.")}
        </TabsContent>
         <TabsContent value="my" className="mt-4">
             {renderTicketTable(paginatedTickets, "No tickets are assigned to you.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
