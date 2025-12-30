import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2, Edit, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { communicationService } from "@/services/ApiServices";
import { useToast } from "@/hooks/use-toast";
import { CommentCard } from "@/components/communication/CommentCard";
import { VoteButtons } from "@/components/communication/VoteButtons";
import { containsInappropriateContent } from "@/lib/contentFilter";

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sortBy, setSortBy] = useState<'top' | 'new'>('top');

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId, sortBy]);

  const fetchPost = async () => {
    try {
      const response = await communicationService.getPostById(postId!);
      if (response.success && response.data) {
        setPost(response.data);
        setIsSaved(response.data.savedBy?.includes(localStorage.getItem('userId')) || false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch post",
        variant: "destructive",
      });
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await communicationService.getPostComments(postId!, {
        sortBy,
        limit: 100
      });
      
      if (response.success && response.data) {
        setComments(response.data.comments || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    // Check for inappropriate content
    if (containsInappropriateContent(commentText)) {
      toast({
        title: "Inappropriate Content Detected",
        description: "Your comment contains offensive language. Please remove inappropriate words and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await communicationService.createComment({
        content: commentText,
        postId: postId!,
      });

      if (response.success) {
        toast({
          title: "Comment posted!",
          description: "Your comment has been added.",
        });
        setCommentText("");
        fetchComments();
        fetchPost();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await communicationService.toggleSavePost(postId!);
      
      if (response.success) {
        setIsSaved(response.data.isSaved);
        toast({
          title: response.data.isSaved ? "Post saved" : "Post unsaved",
          description: response.data.isSaved 
            ? "You can find this post in your saved items" 
            : "Post removed from saved items",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center gap-3 px-6 py-3 max-w-7xl mx-auto">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Post Content */}
        <div className="flex max-w-7xl mx-auto">
          {/* Vote Section - Left Side */}
          <div className="hidden md:block w-12 pt-2 pl-4">
            <div className="sticky top-20">
              <VoteButtons 
                postId={post._id}
                initialUpvotes={post.upvotes}
                initialDownvotes={post.downvotes}
                upvotedBy={post.upvotedBy}
                downvotedBy={post.downvotedBy}
                onUpdate={fetchPost}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Card className="rounded-none border-x-0 border-t-0">
              <div className="p-6">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getUserInitials(post.author?.name || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {post.author?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(post.createdAt)}
                      </span>
                    </div>
                    {post.author?.currentPosition && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {post.author.currentPosition}
                        {post.author.company && ` at ${post.author.company}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSave}
                      className={isSaved ? 'text-primary' : ''}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mb-3">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {post.category}
                  </Badge>
                </div>

                {/* Post Content */}
                <div className="prose prose-sm max-w-none mb-4">
                  <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
                    {post.content}
                  </p>
                </div>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-muted">
                    {post.images.length === 1 ? (
                      <img 
                        src={post.images[0]} 
                        alt="Post image"
                        className="w-full h-auto max-h-[600px] object-contain"
                      />
                    ) : (
                      <div className={`grid gap-2 ${
                        post.images.length === 2 ? 'grid-cols-2' : 
                        post.images.length === 3 ? 'grid-cols-3' :
                        'grid-cols-2'
                      }`}>
                        {post.images.map((image: string, index: number) => (
                          <img 
                            key={index}
                            src={image} 
                            alt={`Post image ${index + 1}`}
                            className="w-full h-64 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {post.commentsCount || 0} Comments
                    </span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Share</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSave}
                    className={`gap-2 ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="text-xs font-medium">{isSaved ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="rounded-none border-x-0 border-b-0 mt-4">
              <div className="p-6">
                {/* Comment Input */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getUserInitials(localStorage.getItem('userName') || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="What are your thoughts?"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="min-h-[100px] mb-2 resize-none border-border focus:border-primary"
                        disabled={isSubmitting}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCommentText("")}
                          disabled={isSubmitting || !commentText}
                        >
                          Clear
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleCommentSubmit}
                          disabled={!commentText.trim() || isSubmitting}
                        >
                          {isSubmitting ? "Posting..." : "Comment"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Sort and Count */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-2">Sort by:</span>
                    <Button
                      variant={sortBy === 'top' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setSortBy('top')}
                      className="h-7 text-xs"
                    >
                      Top
                    </Button>
                    <Button
                      variant={sortBy === 'new' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setSortBy('new')}
                      className="h-7 text-xs"
                    >
                      New
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading comments...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No comments yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Be the first to share your thoughts!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {comments.map((comment, index) => (
                        <div key={comment._id} className={index > 0 ? 'border-t border-border/50' : ''}>
                          <CommentCard 
                            comment={comment}
                            postId={postId!}
                            onUpdate={fetchComments}
                            depth={0}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
