
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
import { Search, PlusCircle, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ticket } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/data-table-pagination";

export default function MyTicketsPage() {
    const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
    const [resolvedTickets, setResolvedTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    const [activePage, setActivePage] = useState(1);
    const [resolvedPage, setResolvedPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

     const filteredActiveTickets = useMemo(() => {
        return activeTickets.filter(ticket => 
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [activeTickets, searchTerm]);

    const filteredResolvedTickets = useMemo(() => {
        return resolvedTickets.filter(ticket => 
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [resolvedTickets, searchTerm]);

    const paginatedActiveTickets = filteredActiveTickets.slice((activePage - 1) * perPage, activePage * perPage);
    const activePageCount = Math.ceil(filteredActiveTickets.length / perPage);

    const paginatedResolvedTickets = filteredResolvedTickets.slice((resolvedPage - 1) * perPage, resolvedPage * perPage);
    const resolvedPageCount = Math.ceil(filteredResolvedTickets.length / perPage);


    useEffect(() => {
        if (authLoading || !user) {
            setActiveTickets([]);
            setResolvedTickets([]);
            if (!authLoading) setLoading(false);
            return;
        };

        const baseQuery = query(collection(db, 'tickets'), where('createdBy', '==', user.email));
        
        const activeQuery = query(baseQuery, where('status', 'in', ['Open', 'In Progress']));
        const resolvedQuery = query(baseQuery, where('status', '==', 'Resolved'));

        const unsubscribeActive = onSnapshot(activeQuery, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                 } as Ticket
            });
            setActiveTickets(ticketsData);
            setLoading(false);
        });

        const unsubscribeResolved = onSnapshot(resolvedQuery, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                 } as Ticket
            });
            setResolvedTickets(ticketsData);
        });

        return () => {
            unsubscribeActive();
            unsubscribeResolved();
        };
    }, [user, authLoading]);

    const handleReopen = async (ticketId: string) => {
        const ticketRef = doc(db, "tickets", ticketId);
        try {
            await updateDoc(ticketRef, { status: "Open", updatedAt: new Date() });
            toast({ title: "Success", description: "Ticket has been reopened." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to reopen ticket.", variant: "destructive" });
        }
    };

    const handleDelete = async (ticketId: string) => {
        const ticketRef = doc(db, "tickets", ticketId);
        try {
            await deleteDoc(ticketRef);
            toast({ title: "Success", description: "Ticket has been deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete ticket.", variant: "destructive" });
        }
    };

    const renderTicketTable = (
        tickets: Ticket[],
        page: number,
        pageCount: number,
        setPage: (page: number) => void,
        isResolved = false
    ) => (
         <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading tickets...</TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            {searchTerm ? "No tickets match your search." : isResolved ? "You have no resolved tickets." : "You have not created any active tickets yet."}
                        </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell>
                            <Link href={`/dashboard/support-agent/tickets/${ticket.id}`} className="font-medium text-foreground hover:underline">
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
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                {isResolved ? (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => handleReopen(ticket.id)}>
                                            <RotateCcw className="mr-2 h-4 w-4" /> Reopen
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(ticket.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                    </>
                                ) : (
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/support-agent/tickets/${ticket.id}`}>View</Link>
                                    </Button>
                                )}
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
            <h1 className="text-3xl font-bold font-headline text-foreground">My Tickets</h1>
            <p className="text-muted-foreground">Manage your support tickets.</p>
        </div>
        <Link href="/dashboard/end-user/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="active">Active Tickets</TabsTrigger>
            <TabsTrigger value="resolved">Resolved Tickets</TabsTrigger>
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
        <TabsContent value="active" className="mt-4">
          {renderTicketTable(paginatedActiveTickets, activePage, activePageCount, setActivePage)}
        </TabsContent>
        <TabsContent value="resolved" className="mt-4">
          {renderTicketTable(paginatedResolvedTickets, resolvedPage, resolvedPageCount, setResolvedPage, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
