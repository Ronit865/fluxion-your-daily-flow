import { useState, useEffect, useRef } from "react";
import { Send, MoreVertical, Loader2, Trash2, ArrowLeft, Search, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { messageService, userService } from "@/services/ApiServices";
import { useToast } from "@/hooks/use-toast";
import { containsInappropriateContent } from "@/lib/contentFilter";
import { formatDistanceToNow } from "date-fns";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  conversationId?: string;
  participantName?: string;
  participantAvatar?: string;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  _id: string;
  participant: {
    _id: string;
    name: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

export function ChatDialog({ 
  open, 
  onOpenChange, 
  userId, 
  conversationId: initialConversationId,
  participantName,
  participantAvatar 
}: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [participant, setParticipant] = useState({ name: participantName, avatar: participantAvatar });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConversationList, setShowConversationList] = useState(!initialConversationId && !userId);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userService.getCurrentUser();
        const userData = response?.data?.data || response?.data || response;
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch conversations when dialog opens without specific conversation
  useEffect(() => {
    if (open && !initialConversationId && !userId) {
      setShowConversationList(true);
      fetchConversations();
    } else if (open && (initialConversationId || userId)) {
      setShowConversationList(false);
    }
  }, [open, initialConversationId, userId]);

  // Create or get conversation when dialog opens
  useEffect(() => {
    if (open && userId && !initialConversationId) {
      createConversation();
    } else if (open && initialConversationId) {
      setConversationId(initialConversationId);
      setParticipant({ name: participantName, avatar: participantAvatar });
      fetchMessagesForConversation(initialConversationId);
    }
  }, [open, userId, initialConversationId]);

  // Auto-refresh messages every 5 seconds when conversation is open
  useEffect(() => {
    if (!open || !conversationId) return;

    const interval = setInterval(async () => {
      try {
        const response = await messageService.getConversationMessages(conversationId, { limit: 50 });
        const messagesData = response?.data?.messages || response?.data || [];
        const newMessages = Array.isArray(messagesData) ? messagesData : [];
        
        // Only update if there are new messages
        if (newMessages.length > messages.length) {
          setMessages(newMessages);
          await messageService.markMessagesAsRead(conversationId);
          setTimeout(() => scrollToBottom('smooth'), 100);
        }
      } catch (error) {
        console.error('Error refreshing messages:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [open, conversationId, messages.length]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messageService.getUserConversations();
      const conversationsData = response?.data || [];
      setConversations(Array.isArray(conversationsData) ? conversationsData : []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    try {
      setLoading(true);
      const response = await messageService.getOrCreateConversation(userId!);
      const conv = response?.data;
      if (conv) {
        setConversationId(conv._id);
        setParticipant({
          name: conv.participants?.find((p: any) => p._id !== currentUser?._id)?.name || participantName,
          avatar: conv.participants?.find((p: any) => p._id !== currentUser?._id)?.avatar || participantAvatar
        });
        await fetchMessagesForConversation(conv._id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create conversation"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesForConversation = async (convId: string) => {
    try {
      setLoading(true);
      const response = await messageService.getConversationMessages(convId, { limit: 50 });
      const messagesData = response?.data?.messages || response?.data || [];
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      setTimeout(() => scrollToBottom('auto'), 100);
      await messageService.markMessagesAsRead(convId);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch messages"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setConversationId(conv._id);
    setParticipant({
      name: conv.participant?.name,
      avatar: conv.participant?.avatar
    });
    setShowConversationList(false);
    fetchMessagesForConversation(conv._id);
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setMessages([]);
    setConversationId(undefined);
    fetchConversations();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    if (containsInappropriateContent(newMessage)) {
      toast({
        variant: "destructive",
        title: "Inappropriate Content Detected",
        description: "Your message contains offensive language. Please remove inappropriate words and try again."
      });
      return;
    }

    // Create optimistic message for instant UI update
    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      content: newMessage.trim(),
      sender: {
        _id: currentUser?._id || '',
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar || ''
      },
      createdAt: new Date().toISOString(),
      read: false
    };

    // Immediately update UI
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setTimeout(() => scrollToBottom('smooth'), 50);

    // Send to API in background
    try {
      const response = await messageService.sendMessage(conversationId, optimisticMessage.content);
      const newMsg = response?.data;
      if (newMsg) {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m._id === optimisticMessage._id ? newMsg : m));
      }
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to send message"
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Immediately remove message from UI for instant feedback
    setMessages(prev => prev.filter(m => m._id !== messageId));
    
    toast({
      title: "Success",
      description: "Message deleted successfully"
    });
    
    // Call API in background
    try {
      await messageService.deleteMessage(messageId);
    } catch (error: any) {
      // Silently handle or log error
      console.error("Delete message error:", error);
      // Optionally refresh messages if failed
      if (conversationId) {
        fetchMessagesForConversation(conversationId);
      }
    }
  };

  const canDeleteMessage = (messageDate: string): boolean => {
    const messageTime = new Date(messageDate).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - messageTime) <= twentyFourHours;
  };

  const getMessageTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return date;
    }
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[80vw] h-[80vh] max-h-[80vh] p-0 flex flex-col backdrop-blur-sm border-border/50 shadow-2xl">
        {showConversationList ? (
          <>
            {/* Conversations List Header */}
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-lg font-semibold">Personal Messages</DialogTitle>
            </DialogHeader>

            {/* Search */}
            <div className="px-6 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-full py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv._id}
                      onClick={() => handleSelectConversation(conv)}
                      className="flex items-center gap-4 p-4 hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.participant?.avatar} />
                        <AvatarFallback className="bg-primary/20 text-primary font-medium">
                          {conv.participant?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conv.participant?.name}</p>
                          {conv.lastMessage?.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Chat Header */}
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary font-medium">
                    {participant.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <DialogTitle className="text-lg font-semibold">{participant.name || 'Chat'}</DialogTitle>
              </div>
            </DialogHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMe = message.sender._id === currentUser?._id;
                    const canDelete = isMe && canDeleteMessage(message.createdAt);
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-end gap-1 max-w-[70%] group ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                          <div className="relative">
                            <div className={`rounded-2xl px-4 py-2 ${
                              isMe 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            }`}>
                              <p className="text-sm break-words">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                isMe 
                                  ? "text-primary-foreground/70" 
                                  : "text-muted-foreground"
                              }`}>
                                {getMessageTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                          {isMe && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 mb-1"
                                >
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMessage(message._id)}
                                  disabled={!canDelete}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {canDelete ? "Delete message" : "Delete (expired)"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {!isMe && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {message.sender.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="px-6 py-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={!conversationId}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !conversationId}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
