import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Share, Bookmark, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoteButtons } from "./VoteButtons";
import { communicationService } from "@/services/ApiServices";
import { useToast } from "@/hooks/use-toast";

interface RedditPostProps {
  post: any;
  onUpdate?: () => void;
}

export function RedditPostCard({ post, onUpdate }: RedditPostProps) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(post.savedBy?.includes(localStorage.getItem('userId')) || false);
  const { toast } = useToast();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }
    navigate(`/communications/post/${post._id}`);
  };

  const handleSave = async () => {
    // Immediately update UI for instant feedback
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    
    toast({
      title: newSavedState ? "Post saved" : "Post unsaved",
      description: newSavedState 
        ? "You can find this post in your saved items" 
        : "Post removed from saved items",
    });

    // Call API in background
    try {
      await communicationService.toggleSavePost(post._id);
    } catch (error: any) {
      // Revert on error
      setIsSaved(!newSavedState);
      toast({
        title: "Error",
        description: error.message || "Failed to save post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    // Immediately update UI for instant feedback
    if (onUpdate) {
      onUpdate();
    }
    
    toast({
      title: "Post deleted",
      description: "Your post has been removed.",
    });
    
    // Call API in background
    try {
      await communicationService.deletePost(post._id);
    } catch (error: any) {
      // Silently handle or show minimal error
      console.error("Delete post error:", error);
      if (onUpdate) {
        onUpdate(); // Refresh to restore if failed
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const getUserInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const canDeletePost = (): boolean => {
    const postTime = new Date(post.createdAt).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - postTime) <= twentyFourHours;
  };

  const isAuthor = post.author?._id === localStorage.getItem('userId');
  const canDelete = isAuthor && canDeletePost();

  // Debug logging
  console.log('Post author ID:', post.author?._id);
  console.log('Current user ID:', localStorage.getItem('userId'));
  console.log('Is author:', isAuthor);
  console.log('Can delete:', canDelete);

  return (
    <Card 
      className="bg-card border border-border hover:border-accent-foreground/20 transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex gap-0">
        {/* Vote Section */}
        <VoteButtons
          postId={post._id}
          initialUpvotes={post.upvotes}
          initialDownvotes={post.downvotes}
          upvotedBy={post.upvotedBy || []}
          downvotedBy={post.downvotedBy || []}
          onUpdate={onUpdate}
        />

        {/* Content Section */}
        <div className="flex-1 p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={post.author?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {getUserInitials(post.author?.name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {post.author?.name || 'Anonymous'}
                </span>
                {post.author?.graduationYear && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">'{post.author.graduationYear.toString().slice(-2)}</span>
                  </>
                )}
                <span className="text-xs text-muted-foreground">•</span>
                <Badge variant="outline" className="text-xs px-2 py-0">
                  {post.category}
                </Badge>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSave}>
                  <Bookmark className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Unsave' : 'Save'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                {isAuthor && (
                  <>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      disabled={!canDelete}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {canDelete ? 'Delete' : 'Delete (expired)'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Message Content */}
          <div className="mb-3">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>
            
            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className={`mt-2 grid gap-2 ${
                post.images.length === 1 ? 'grid-cols-1' : 
                post.images.length === 2 ? 'grid-cols-2' : 
                'grid-cols-3'
              }`}>
                {post.images.map((image: string, index: number) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`Post image ${index + 1}`}
                    className="w-full h-auto rounded-md border object-cover max-h-96"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/communications/post/${post._id}`);
              }}
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{post.commentsCount || 0} comments</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Share className="w-4 h-4" />
              <span className="text-xs">Share</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`gap-2 hover:bg-accent ${
                isSaved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={handleSave}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-xs">{isSaved ? 'Saved' : 'Save'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}