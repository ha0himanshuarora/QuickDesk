
"use client";
import { notFound, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, User, Calendar, Tag, Shield, ArrowLeft } from "lucide-react";
import { AiSuggestions } from "@/components/ai-suggestions";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Ticket, Comment } from "@/lib/mock-data";

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const docRef = doc(db, "tickets", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Manually convert Timestamps
            const ticketData: Ticket = {
                id: docSnap.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                comments: data.comments.map((c: any) => ({
                    ...c,
                    createdAt: (c.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                }))
            } as Ticket;
            setTicket(ticketData);
        } else {
            setTicket(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();

  }, [id]);

  const handlePostReply = async () => {
    if (!newComment.trim() || !auth.currentUser) return;
    const comment: Comment = {
      id: "c" + Date.now(),
      author: auth.currentUser.email || "User",
      authorAvatar: 'https://placehold.co/100x100.png',
      content: newComment,
      createdAt: new Date().toISOString(),
    };
    try {
        const ticketRef = doc(db, "tickets", id);
        // Firestore timestamps need to be converted back for update
        const fbComment = {
            ...comment,
            createdAt: new Date(comment.createdAt)
        }
        await updateDoc(ticketRef, {
            comments: arrayUnion(fbComment),
            updatedAt: new Date()
        });
        setNewComment("");
    } catch (error) {
        console.error("Error posting comment: ", error);
    }
  };


  if (loading) {
    return <div>Loading ticket...</div>
  }

  if (!ticket) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
        </Link>
        <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <Badge variant="outline">{ticket.category}</Badge>
                                <CardTitle className="mt-2 text-2xl font-headline text-foreground">{ticket.subject}</CardTitle>
                            </div>
                            <TicketStatusBadge status={ticket.status} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{ticket.description}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h3 className="text-xl font-semibold font-headline">Conversation</h3>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    {ticket.comments.map((comment, index) => (
                        <div key={index} className="flex items-start gap-4">
                        <Avatar>
                            <AvatarImage src={comment.authorAvatar} data-ai-hint="person face" />
                            <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="w-full">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-foreground">{comment.author}</p>
                                <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="mt-2 rounded-md bg-secondary/50 p-3">
                                <p className="text-sm text-secondary-foreground">{comment.content}</p>
                            </div>
                        </div>
                        </div>
                    ))}
                    <div className="w-full pt-6">
                        <Label htmlFor="comment" className="font-semibold">Add a reply</Label>
                        <Textarea id="comment" placeholder="Type your comment here..." className="mt-2" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handlePostReply}>Post Reply</Button>
                        </div>
                    </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6 sticky top-20">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Ticket Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center"><User className="w-4 h-4 mr-2"/> Requester</span>
                        <span className="text-foreground font-medium">{ticket.createdBy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center"><Shield className="w-4 h-4 mr-2"/> Agent</span>
                        <span className="text-foreground font-medium">{ticket.agent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center"><Calendar className="w-4 h-4 mr-2"/> Created</span>
                        <span className="text-foreground font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center"><Tag className="w-4 h-4 mr-2"/> Priority</span>
                        <Badge variant={ticket.priority === 'High' ? 'destructive' : ticket.priority === 'Medium' ? 'default' : 'outline'} className="capitalize">{ticket.priority.toLowerCase()}</Badge>
                    </div>
                    <Separator className="my-2"/>
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <Button variant="outline" size="sm">
                            <ThumbsUp className="mr-2 h-4 w-4" /> {ticket.upvotes}
                        </Button>
                        <Button variant="outline" size="sm">
                            <ThumbsDown className="mr-2 h-4 w-4" /> {ticket.downvotes}
                        </Button>
                    </div>
                </CardContent>
                </Card>
                <AiSuggestions subject={ticket.subject} description={ticket.description} />
            </div>
        </div>
    </div>
  );
}
