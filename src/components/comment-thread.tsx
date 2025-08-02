
"use client";

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleReply, Trash2 } from 'lucide-react';
import { Comment as CommentType } from "@/lib/mock-data";
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CommentThreadProps {
  comment: CommentType;
  onReply: (parentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  level?: number;
}

export function CommentThread({ comment, onReply, onDelete, level = 0 }: CommentThreadProps) {
  const { user } = useAuth();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyBox(false);
    }
  };

  const isAuthor = user?.email === comment.author;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="relative flex items-start gap-4">
      {level > 0 && (
         <div className="absolute left-5 top-14 h-[calc(100%-3.5rem)] w-px bg-border -translate-x-1/2"></div>
      )}

      <Avatar className="z-10">
        <AvatarImage src={comment.authorAvatar} data-ai-hint="person face" />
        <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="w-full">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">{comment.author}</p>
          <p className="text-xs text-muted-foreground">{new Date(comment.createdAt as string).toLocaleString()}</p>
        </div>
        <div className="mt-2 rounded-md bg-secondary/50 p-3">
          <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{comment.content}</p>
        </div>
        <div className="mt-2 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowReplyBox(!showReplyBox)}>
                <MessageCircleReply className="w-4 h-4 mr-2" />
                Reply
            </Button>
            {isAuthor && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your comment and any replies to it.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(comment.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        
        {showReplyBox && (
          <div className="mt-4">
            <Textarea 
              placeholder={`Replying to ${comment.author}...`} 
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReplyBox(false)}>Cancel</Button>
              <Button size="sm" onClick={handleReplySubmit}>Post Reply</Button>
            </div>
          </div>
        )}

        {hasReplies && (
          <div className="mt-6 space-y-6 pl-4 border-l border-border/50">
            {comment.replies!.map(reply => (
              <CommentThread key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
