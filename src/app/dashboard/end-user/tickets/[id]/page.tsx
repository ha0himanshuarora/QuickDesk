
"use client";
import { notFound, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Tag, Shield, ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { AiSuggestions } from "@/components/ai-suggestions";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { doc, updateDoc, arrayUnion, onSnapshot, Timestamp, arrayRemove } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Ticket, Comment } from "@/lib/mock-data";
import { Textarea } from "@/components/ui/textarea";
import { CommentThread } from "@/components/comment-thread";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";


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


export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
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
    if (!content.trim() || !auth.currentUser) return;
    const comment: Comment = {
      id: "c" + Date.now(),
      author: auth.currentUser.email || "User",
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
    } catch (error) {
        console.error("Error posting comment: ", error);
        toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
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
  
  const commentTree = useMemo(() => ticket ? buildCommentTree(ticket.comments) : [], [ticket]);

  if (loading) {
    return <div>Loading ticket...</div>
  }

  if (!ticket) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
        <Link href="/dashboard/end-user/my-tickets" className="flex items-center gap-2 text-sm text-white hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to My Tickets
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
                        <h3 className="text-xl font-semibold font-headline text-white">Conversation</h3>
                    </CardHeader>
                    <CardContent className="space-y-6">
                     {commentTree.map((comment) => (
                        <CommentThread key={comment.id} comment={comment} onReply={handlePostReply} onDelete={handleDeleteComment} />
                    ))}
                    <div className="w-full pt-6 border-t border-gray-500/50">
                        <Label htmlFor="comment" className="font-semibold text-white">Add a comment</Label>
                        <Textarea id="comment" placeholder="Type your comment here..." className="mt-2 bg-transparent" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => handlePostReply(null, newComment)} disabled={!newComment.trim()}>Post Comment</Button>
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
                    <Separator className="my-2 bg-gray-500/50"/>
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <Button variant="outline" size="sm" className="cursor-default">
                            <ThumbsUp className="mr-2 h-4 w-4" /> {ticket.upvotes}
                        </Button>
                        <Button variant="outline" size="sm" className="cursor-default">
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
