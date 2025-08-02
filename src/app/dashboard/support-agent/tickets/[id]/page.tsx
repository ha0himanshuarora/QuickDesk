
"use client";
import { notFound, useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Tag, Shield, ArrowLeft, Send, UserCheck, UserX } from "lucide-react";
import { AiSuggestions } from "@/components/ai-suggestions";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp, arrayRemove } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Ticket, Comment } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CommentThread } from "@/components/comment-thread";


const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap: Record<string, Comment> = {};
    const commentTree: Comment[] = [];

    comments.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach(comment => {
        if (comment.parentId && commentMap[comment.parentId]) {
            commentMap[comment.parentId]?.replies?.push(commentMap[comment.id]);
        } else {
            commentTree.push(commentMap[comment.id]);
        }
    });
    
    // Sort replies by creation date
    Object.values(commentMap).forEach(comment => {
        comment.replies?.sort((a,b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime());
    });
     // Sort top-level comments
    commentTree.sort((a,b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime());

    return commentTree;
};


export default function AgentTicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const docRef = doc(db, "tickets", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const ticketData: Ticket = {
                id: docSnap.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                comments: (data.comments || []).map((c: any) => ({
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

   const handlePostReply = async (parentId: string | null, content: string) => {
    if (!content.trim() || !user) return;
    const comment: Comment = {
      id: "c" + Date.now(),
      author: user.email || "Agent",
      authorAvatar: 'https://placehold.co/100x100.png',
      content: content,
      createdAt: new Date().toISOString(),
      parentId: parentId,
      replies: []
    };
    try {
        const ticketRef = doc(db, "tickets", id);
        const fbComment = { ...comment, createdAt: new Date(comment.createdAt) };
        delete fbComment.replies;
        await updateDoc(ticketRef, {
            comments: arrayUnion(fbComment),
            updatedAt: new Date()
        });
        if (parentId === null) {
            setNewComment("");
        }
        toast({ title: "Success", description: "Your reply has been posted." });
    } catch (error) {
        console.error("Error posting comment: ", error);
        toast({ title: "Error", description: "Failed to post reply.", variant: "destructive" });
    }
  };


    const handleDeleteComment = async (commentId: string) => {
        if (!ticket) return;

        const commentsToDelete: Comment[] = [];
        const findCommentAndReplies = (id: string) => {
            const comment = ticket.comments.find(c => c.id === id);
            if (comment) {
                commentsToDelete.push(comment);
                const replies = ticket.comments.filter(c => c.parentId === id);
                replies.forEach(reply => findCommentAndReplies(reply.id));
            }
        }

        findCommentAndReplies(commentId);

        try {
        const ticketRef = doc(db, "tickets", id);
        const fbCommentsToDelete = commentsToDelete.map(c => {
          const {replies, ...rest} = c;
          return {...rest, createdAt: new Date(c.createdAt as string)}
        });
        await updateDoc(ticketRef, {
            comments: arrayRemove(...fbCommentsToDelete),
            updatedAt: new Date(),
        });
        toast({ title: "Success", description: "Comment deleted." });
        } catch (error) {
        console.error("Error deleting comment: ", error);
        toast({ title: "Error", description: "Failed to delete comment.", variant: "destructive" });
        }
    };

  const handleStatusChange = async (newStatus: Ticket['status']) => {
    if (!ticket) return;
     try {
        const ticketRef = doc(db, "tickets", id);
        await updateDoc(ticketRef, {
            status: newStatus,
            updatedAt: new Date()
        });
        toast({ title: "Success", description: `Ticket status updated to ${newStatus}.` });
    } catch (error) {
        console.error("Error updating status: ", error);
        toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };
  
  const handleAssignment = async () => {
    if (!ticket || !user) return;

    const isAssignedToMe = ticket.agent === user.email;
    const newAgent = isAssignedToMe ? "Unassigned" : user.email;
    const successMessage = isAssignedToMe ? "Ticket has been unassigned." : "Ticket assigned to you.";

    try {
      const ticketRef = doc(db, "tickets", id);
      await updateDoc(ticketRef, {
          agent: newAgent,
          updatedAt: new Date()
      });
      toast({ title: "Success", description: successMessage });
    } catch (error) {
      console.error("Error updating assignment: ", error);
      toast({ title: "Error", description: "Failed to update assignment.", variant: "destructive" });
    }
  };
  
  const commentTree = useMemo(() => ticket ? buildCommentTree(ticket.comments) : [], [ticket]);

  if (loading || authLoading) {
    return <div>Loading ticket...</div>;
  }

  if (!ticket) {
    notFound();
  }

  const isAssignedToMe = ticket.agent === user?.email;
  const isUnassigned = ticket.agent === 'Unassigned';

  return (
    <div className="flex flex-col gap-6">
        <Link href="/dashboard/support-agent/tickets" className="flex items-center gap-2 text-sm text-white hover:text-primary">
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
                                <CardTitle className="mt-2 text-2xl font-headline">{ticket.subject}</CardTitle>
                            </div>
                            <TicketStatusBadge status={ticket.status} />
                        </div>
                    </CardHeader>
                    <CardContent className="text-gray-300">
                        <p>{ticket.description}</p>
                         {ticket.attachmentUrl && (
                            <div className="mt-4">
                                <a href={ticket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                                    View Attachment
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h3 className="text-xl font-semibold font-headline">Conversation</h3>
                    </CardHeader>
                    <CardContent className="space-y-6">
                     {commentTree.map((comment) => (
                        <CommentThread key={comment.id} comment={comment} onReply={handlePostReply} onDelete={handleDeleteComment} />
                    ))}
                    </CardContent>
                    <CardFooter className="pt-6 flex-col items-start gap-4 border-t border-gray-500/50">
                        <Label htmlFor="comment" className="font-semibold text-white">Add a comment</Label>
                        <Textarea id="comment" placeholder="Type your comment here..." className="mt-2 bg-transparent" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                        <div className="flex justify-end w-full">
                            <Button onClick={() => handlePostReply(null, newComment)} disabled={!newComment.trim()}>
                                <Send className="mr-2 h-4 w-4" />
                                Post Comment
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
            <div className="space-y-6 sticky top-20">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">Ticket Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 flex items-center"><User className="w-4 h-4 mr-2"/> Requester</span>
                            <span className="text-white font-medium">{ticket.createdBy}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 flex items-center"><Shield className="w-4 h-4 mr-2"/> Agent</span>
                            <span className="text-white font-medium">{ticket.agent}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 flex items-center"><Calendar className="w-4 h-4 mr-2"/> Created</span>
                            <span className="text-white font-medium">{new Date(ticket.createdAt as string).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 flex items-center"><Tag className="w-4 h-4 mr-2"/> Priority</span>
                            <Badge variant={ticket.priority === 'High' ? 'destructive' : ticket.priority === 'Medium' ? 'default' : 'outline'} className="capitalize">{ticket.priority.toLowerCase()}</Badge>
                        </div>
                        <Separator className="bg-gray-500/50"/>
                        <div className="space-y-2">
                             <Label className="text-gray-300">Status</Label>
                             <Select onValueChange={(value: Ticket['status']) => handleStatusChange(value)} defaultValue={ticket.status} disabled={ticket.status === 'Resolved' || !isAssignedToMe}>
                                <SelectTrigger className="bg-transparent text-white">
                                    <SelectValue placeholder="Change status" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900/80 backdrop-blur-lg text-white border-gray-500/50">
                                    <SelectItem value="Open" className="focus:bg-gray-700/50">Open</SelectItem>
                                    <SelectItem value="In Progress" className="focus:bg-gray-700/50">In Progress</SelectItem>
                                    <SelectItem value="Resolved" className="focus:bg-gray-700/50">Resolved</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                         <Button variant="outline" className="w-full bg-white/90 text-black hover:bg-white" onClick={handleAssignment} disabled={!isUnassigned && !isAssignedToMe}>
                            {isAssignedToMe ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            {isAssignedToMe ? 'Unassign' : isUnassigned ? 'Assign to Me' : 'Assigned'}
                        </Button>
                    </CardContent>
                </Card>
                <AiSuggestions subject={ticket.subject} description={ticket.description} />
            </div>
        </div>
    </div>
  );
}
