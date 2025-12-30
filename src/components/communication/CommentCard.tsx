import { useState, useEffect } from "react";
import { MessageCircle, MoreHorizontal, Trash2, Edit2, CornerDownRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoteButtons } from "./VoteButtons";
import { communicationService } from "@/services/ApiServices";
import { useToast } from "@/hooks/use-toast";
import { containsInappropriateContent } from "@/lib/contentFilter";

interface CommentCardProps {
  comment: any;
  postId: string;
  onUpdate: () => void;
  depth?: number;
}

export function CommentCard({ comment, postId, onUpdate, depth = 0 }: CommentCardProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const { toast } = useToast();
  const userId = localStorage.getItem('userId');

  // Auto-load replies on mount
  useEffect(() => {
    if (depth < 3 && !repliesLoaded) {
      fetchReplies();
    }
  }, []);

  const fetchReplies = async () => {
    if (repliesLoaded) return;

    try {
      setLoadingReplies(true);
      const response = await communicationService.getCommentReplies(comment._id);
      
      if (response.success && response.data) {
        setReplies(response.data.replies || []);
        setRepliesLoaded(true);
      }
    } catch (error) {
      console.error("Failed to fetch replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;

    // Check for inappropriate content
    if (containsInappropriateContent(replyText)) {
      toast({
        title: "Inappropriate Content Detected",
        description: "Your reply contains offensive language. Please remove inappropriate words and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await communicationService.createComment({
        content: replyText,
        postId,
        parentCommentId: comment._id,
      });

      if (response.success) {
        toast({
          title: "Reply posted!",
          description: "Your reply has been added.",
        });
        setReplyText("");
        setShowReplyBox(false);
        
        // Refresh replies
        const repliesResponse = await communicationService.getCommentReplies(comment._id);
        if (repliesResponse.success && repliesResponse.data) {
          setReplies(repliesResponse.data.replies || []);
          setRepliesLoaded(true);
        }
        
        onUpdate();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === comment.content) {
      setIsEditing(false);
      return;
    }

    // Check for inappropriate content
    if (containsInappropriateContent(editText)) {
      toast({
        title: "Inappropriate Content Detected",
        description: "Your comment contains offensive language. Please remove inappropriate words and try again.",
        variant: "destructive",
      });
      return;
    }

    // Immediately update UI and close edit mode
    const originalContent = comment.content;
    comment.content = editText;
    setIsEditing(false);
    
    toast({
      title: "Comment updated",
      description: "Your comment has been updated.",
    });

    // Call API in background
    try {
      await communicationService.updateComment(comment._id, {
        content: editText
      });
      onUpdate();
    } catch (error: any) {
      // Revert on error
      comment.content = originalContent;
      setEditText(originalContent);
      onUpdate();
      toast({
        title: "Error",
        description: error.message || "Failed to update comment",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    // Immediately update UI for instant feedback
    onUpdate();
    
    toast({
      title: "Comment deleted",
      description: "Your comment has been removed.",
    });
    
    // Call API in background
    try {
      await communicationService.deleteComment(comment._id);
    } catch (error: any) {
      // Silently handle or show minimal error
      console.error("Delete comment error:", error);
      onUpdate(); // Refresh to restore if failed
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getUserInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const canDeleteComment = (): boolean => {
    const commentTime = new Date(comment.createdAt).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - commentTime) <= twentyFourHours;
  };

  const isAuthor = comment.author?._id === userId;
  const canDelete = isAuthor && canDeleteComment();

  const maxDepth = 5;
  const shouldShowReplyButton = depth < maxDepth;

  return (
    <div className="group">
      <div className="flex gap-2 py-2">
        {/* Vote Section - Vertical */}
        <div className="flex-shrink-0 pt-1">
          <VoteButtons
            commentId={comment._id}
            initialUpvotes={comment.upvotes || 0}
            initialDownvotes={comment.downvotes || 0}
            upvotedBy={comment.upvotedBy || []}
            downvotedBy={comment.downvotedBy || []}
            onUpdate={onUpdate}
            compact
          />
        </div>

        <div className="flex-1 min-w-0 flex gap-2">
          {/* Avatar */}
          <div className="relative flex-shrink-0 mt-0.5">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.author?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {getUserInitials(comment.author?.name || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Comment Header */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-medium text-foreground">
                {comment.author?.name || 'Anonymous'}
              </span>
              {comment.author?.currentPosition && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {comment.author.currentPosition}
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(comment.createdAt)}
              </span>
            </div>

            {/* Comment Content */}
            {isEditing ? (
              <div className="space-y-2 mb-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[70px] bg-muted/50 border-border focus:border-primary text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEdit} className="h-7 text-xs">
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.content);
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 mb-1.5">
                {comment.content}
              </p>
            )}

            {/* Comment Actions */}
            <div className="flex items-center gap-1">
              {shouldShowReplyButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyBox(!showReplyBox)}
                  className="h-6 px-2 text-xs font-medium hover:bg-accent"
                >
                  <CornerDownRight className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-28">
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-xs">
                      <Edit2 className="mr-2 h-3 w-3" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      disabled={!canDelete}
                      className="text-xs text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      {canDelete ? 'Delete' : 'Delete (expired)'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Reply Box */}
            {showReplyBox && (
              <div className="mt-2 mb-2 bg-muted/20 rounded-md p-2.5 border border-border/40">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[60px] mb-2 bg-background text-sm"
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim() || isSubmitting}
                    className="h-7 text-xs"
                  >
                    {isSubmitting ? "Posting..." : "Reply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowReplyBox(false);
                      setReplyText("");
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Nested Replies with vertical line */}
            {repliesLoaded && replies.length > 0 && (
              <div className="mt-2 pl-3 border-l-2 border-border/60">
                {replies.map((reply) => (
                  <CommentCard
                    key={reply._id}
                    comment={reply}
                    postId={postId}
                    onUpdate={() => {
                      fetchReplies();
                      onUpdate();
                    }}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {loadingReplies && (
              <div className="mt-2 text-xs text-muted-foreground">
                Loading replies...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
