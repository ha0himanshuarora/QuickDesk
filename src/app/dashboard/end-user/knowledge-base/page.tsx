
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, Timestamp, doc, updateDoc, increment, writeBatch, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ticket } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "@/components/data-table-pagination";
import { Label } from "@/components/ui/label";

type SortBy = "votes" | "comments" | "newest";
type FilterCategory = "All" | "General Inquiry" | "Technical Support" | "Billing" | "Bug Report";


export default function KnowledgeBasePage() {
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});
    
    const [sortBy, setSortBy] = useState<SortBy>("votes");
    const [filterCategory, setFilterCategory] = useState<FilterCategory>("All");
    const [searchTerm, setSearchTerm] = useState("");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);


     useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'tickets'));
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
            setLoading(false);

            // Fetch user votes
            const votesPromises = snapshot.docs.map(ticketDoc => 
                getDoc(doc(db, `tickets/${ticketDoc.id}/votes`, user.uid))
            );
            Promise.all(votesPromises).then(votesSnapshots => {
                const votes: Record<string, 'up' | 'down'> = {};
                votesSnapshots.forEach((voteSnap, index) => {
                    if (voteSnap.exists()) {
                        votes[snapshot.docs[index].id] = voteSnap.data().type;
                    }
                });
                setUserVotes(votes);
            });
        });
        return () => unsubscribe();
    }, [user]);

    const filteredAndSortedTickets = useMemo(() => {
        return tickets
            .filter(ticket => {
                const categoryMatch = filterCategory === 'All' || ticket.category === filterCategory;
                const searchMatch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
                return categoryMatch && searchMatch;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "votes":
                        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
                    case "comments":
                        return (b.comments?.length || 0) - (a.comments?.length || 0);
                    case "newest":
                        return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime();
                    default:
                        return 0;
                }
            });
    }, [tickets, sortBy, filterCategory, searchTerm]);

    const pageCount = Math.ceil(filteredAndSortedTickets.length / perPage);
    const paginatedTickets = filteredAndSortedTickets.slice((page - 1) * perPage, page * perPage);

    const handleVote = async (ticketId: string, voteType: 'up' | 'down') => {
        if (!user) return;

        const ticketRef = doc(db, "tickets", ticketId);
        const voteRef = doc(db, `tickets/${ticketId}/votes`, user.uid);
        const currentVote = userVotes[ticketId];
        const batch = writeBatch(db);

        if (currentVote === voteType) { // Undoing vote
            batch.delete(voteRef);
            batch.update(ticketRef, { [`${voteType}votes`]: increment(-1) });
            setUserVotes(prev => ({...prev, [ticketId]: undefined as any}));
        } else if (currentVote) { // Switching vote
            batch.update(voteRef, { type: voteType });
            batch.update(ticketRef, {
                [`${currentVote}votes`]: increment(-1),
                [`${voteType}votes`]: increment(1)
            });
             setUserVotes(prev => ({...prev, [ticketId]: voteType}));
        } else { // New vote
            batch.set(voteRef, { type: voteType });
            batch.update(ticketRef, { [`${voteType}votes`]: increment(1) });
             setUserVotes(prev => ({...prev, [ticketId]: voteType}));
        }

        await batch.commit();
    };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">Community Tickets</h1>
            <p className="text-muted-foreground">Browse and learn from previously resolved tickets from the community.</p>
        </div>
      </div>
       <Card>
           <CardContent className="pt-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="grid gap-2">
                       <Label>Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                            type="search"
                            placeholder="Search tickets..."
                            className="w-full rounded-lg bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                   </div>
                   <div className="grid gap-2">
                       <Label htmlFor="category">Category</Label>
                       <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as FilterCategory)}>
                           <SelectTrigger id="category">
                               <SelectValue placeholder="Select Category" />
                           </SelectTrigger>
                           <SelectContent>
                               <SelectItem value="All">All Categories</SelectItem>
                               <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                               <SelectItem value="Technical Support">Technical Support</SelectItem>
                               <SelectItem value="Billing">Billing</SelectItem>
                               <SelectItem value="Bug Report">Bug Report</SelectItem>
                           </SelectContent>
                       </Select>
                   </div>
                   <div className="grid gap-2">
                       <Label htmlFor="sort">Sort By</Label>
                       <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                           <SelectTrigger id="sort">
                               <SelectValue placeholder="Sort By" />
                           </SelectTrigger>
                           <SelectContent>
                               <SelectItem value="votes">Most Votes</SelectItem>
                               <SelectItem value="comments">Most Comments</SelectItem>
                               <SelectItem value="newest">Newest</SelectItem>
                           </SelectContent>
                       </Select>
                   </div>
               </div>
           </CardContent>
       </Card>

        <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Votes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authLoading || loading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">Loading tickets...</TableCell>
                    </TableRow>
                  ) : paginatedTickets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">No tickets found matching your criteria.</TableCell>
                    </TableRow>
                  ) : (
                    paginatedTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell>
                            <Link href={`/dashboard/support-agent/tickets/${ticket.id}`} className="font-medium text-foreground hover:underline">
                                {ticket.subject}
                            </Link>
                            <div className="text-sm text-muted-foreground hidden sm:block">by {ticket.createdBy}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <Badge variant="outline">{ticket.category}</Badge>
                            </TableCell>
                            <TableCell>
                                <TicketStatusBadge status={ticket.status} />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                     <Button variant="ghost" size="sm" onClick={() => handleVote(ticket.id, 'up')}>
                                        <ThumbsUp className={cn("h-4 w-4 mr-2", userVotes[ticket.id] === 'up' && "text-primary fill-primary")}/>
                                        {ticket.upvotes}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleVote(ticket.id, 'down')}>
                                        <ThumbsDown className={cn("h-4 w-4 mr-2", userVotes[ticket.id] === 'down' && "text-destructive fill-destructive")}/>
                                        {ticket.downvotes}
                                    </Button>
                                </div>
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
    </div>
  );
}
