import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Search, Phone, Video, MoreVertical, Pin, Star, Archive, Loader2, UserPlus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { messageService, userService, connectionService } from "@/services/ApiServices";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { containsInappropriateContent } from "@/lib/contentFilter";

// Cache helper functions
const CACHE_KEY_PREFIX = 'chat_messages_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const getCachedMessages = (conversationId: string) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + conversationId);
    if (cached) {
      const { messages, timestamp } = JSON.parse(cached);
      // Check if cache is still valid (less than 24 hours old)
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return messages;
      }
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
};

const setCachedMessages = (conversationId: string, messages: any[]) => {
  try {
    const cacheData = {
      messages,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY_PREFIX + conversationId, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

const clearCachedMessages = (conversationId: string) => {
  try {
    localStorage.removeItem(CACHE_KEY_PREFIX + conversationId);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

interface User {
  _id: string;
  name: string;
  avatar?: string;
  email: string;
  currentPosition?: string;
  graduationYear?: string;
}

interface Connection {
  _id: string;
  user: User;
  status: string;
  connectedAt: string;
}

interface Message {
  _id: string;
  sender: User;
  content: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  _id: string;
  participant: User;
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: string;
    read: boolean;
  };
  lastMessageTime?: string;
}

export default function PersonalMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Handle incoming userId from navigation (e.g., from Alumni page Message button)
  useEffect(() => {
    const userId = location.state?.userId;
    
    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return; // Skip if no valid userId
    }

    if (!currentUser) {
      return; // Wait for current user to load
    }

    // Don't create conversation with yourself
    if (userId === currentUser._id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot message yourself"
      });
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // Create or get conversation with this user
    const createConversationWithUser = async () => {
      try {
        console.log("Creating conversation with userId:", userId);
        const response = await messageService.getOrCreateConversation(userId);
        console.log("Conversation response:", response);
        
        const newConversation = response?.data;
        
        if (!newConversation) {
          throw new Error("Invalid response from server");
        }

        // Add to conversations list if not already there
        setConversations(prev => {
          if (!Array.isArray(prev)) return [newConversation];
          const exists = prev.find(c => c?._id === newConversation._id);
          if (exists) return prev;
          return [newConversation, ...prev];
        });
        
        // Select this conversation
        setSelectedConversation(newConversation);
      } catch (error: any) {
        console.error("Error creating conversation:", error);
        console.error("Error response:", error.response);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.response?.data?.message || error.message || "Failed to create conversation"
        });
      }
    };
    
    createConversationWithUser();
    // Clear the state
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.userId, currentUser]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userService.getCurrentUser();
        console.log('Current user response:', response);
        // Handle different response structures
        const userData = response?.data?.data || response?.data || response;
        console.log('Current user data:', userData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch conversations and connections
  useEffect(() => {
    fetchConversations();
    fetchConnections();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messageService.getUserConversations();
      console.log('Conversations API Response:', response);
      const conversationsData = response?.data || [];
      console.log('Conversations Data:', conversationsData);
      setConversations(Array.isArray(conversationsData) ? conversationsData : []);
      
      // Select first conversation if exists
      if (conversationsData.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsData[0]);
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch conversations"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await connectionService.getConnections({ status: 'accepted' });
      console.log('Connections API Response:', response);
      const connectionsData = response?.data || [];
      console.log('Connections Data:', connectionsData);
      setConnections(Array.isArray(connectionsData) ? connectionsData : []);
    } catch (error: any) {
      console.error('Error fetching connections:', error);
    }
  };

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  }, [messages]);

  const fetchMessages = async (conversationId: string, skipCache = false) => {
    try {
      // Load from cache immediately if available
      if (!skipCache) {
        const cachedMessages = getCachedMessages(conversationId);
        if (cachedMessages && cachedMessages.length > 0) {
          setMessages(cachedMessages);
          setLoadingMessages(false);
          // Scroll to bottom immediately with cached data
          setTimeout(() => scrollToBottom('auto'), 100);
          // Fetch fresh data in background without showing loader
          fetchMessagesFromServer(conversationId, false);
          return;
        }
      }
      
      // No cache, show loading
      setLoadingMessages(true);
      await fetchMessagesFromServer(conversationId, true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch messages"
      });
      setLoadingMessages(false);
    }
  };

  const fetchMessagesFromServer = async (conversationId: string, showLoading = true) => {
    try {
      const response = await messageService.getConversationMessages(conversationId, { limit: 50 });
      const messagesData = response?.data?.messages || response?.data || [];
      const finalMessages = Array.isArray(messagesData) ? messagesData : [];
      
      setMessages(finalMessages);
      
      // Cache the messages
      if (finalMessages.length > 0) {
        setCachedMessages(conversationId, finalMessages);
      }
      
      // Mark as read
      await messageService.markMessagesAsRead(conversationId);
      
      // Scroll to bottom after loading messages
      if (showLoading) {
        setTimeout(() => scrollToBottom('auto'), 100);
      }
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Check for inappropriate content
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
        _id: localStorage.getItem('userId') || '',
        name: 'You',
        avatar: '',
        email: ''
      },
      createdAt: new Date().toISOString(),
      read: false
    };

    // Immediately update UI
    const updatedMessages = Array.isArray(messages) ? [...messages, optimisticMessage] : [optimisticMessage];
    setMessages(updatedMessages);
    setCachedMessages(selectedConversation._id, updatedMessages);
    setNewMessage("");
    setTimeout(() => scrollToBottom('smooth'), 50);

    // Update conversation list optimistically
    setConversations(prev => {
      return prev.map(conv => 
        conv._id === selectedConversation._id 
          ? { ...conv, lastMessage: { content: optimisticMessage.content, createdAt: optimisticMessage.createdAt, sender: optimisticMessage.sender._id, read: false }, lastMessageTime: optimisticMessage.createdAt }
          : conv
      ).sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
    });

    // Send to API in background
    try {
      const response = await messageService.sendMessage(selectedConversation._id, optimisticMessage.content);
      const newMsg = response?.data;
      if (newMsg) {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m._id === optimisticMessage._id ? newMsg : m));
        setCachedMessages(selectedConversation._id, updatedMessages.map(m => m._id === optimisticMessage._id ? newMsg : m));
        
        // Update conversation with real data
        setConversations(prev => {
          return prev.map(conv => 
            conv._id === selectedConversation._id 
              ? { ...conv, lastMessage: { content: newMsg.content, createdAt: newMsg.createdAt, sender: newMsg.sender._id, read: false }, lastMessageTime: newMsg.createdAt }
              : conv
          ).sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
          });
        });
      }
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      setCachedMessages(selectedConversation._id, messages);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to send message. Please try again."
      });
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const response = await messageService.getOrCreateConversation(userId);
      console.log('Start conversation response:', response);
      const newConversation = response?.data;
      
      if (!newConversation) {
        throw new Error("Invalid response from server");
      }

      // Add to conversations list if not already there
      setConversations(prev => {
        if (!Array.isArray(prev)) return [newConversation];
        const exists = prev.find(c => c?._id === newConversation._id);
        if (exists) return prev;
        return [newConversation, ...prev];
      });
      
      // Select this conversation
      setSelectedConversation(newConversation);
      setShowConnections(false);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to start conversation"
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Immediately remove message from UI and cache for instant feedback
    const updatedMessages = messages.filter(m => m._id !== messageId);
    setMessages(updatedMessages);
    
    // Update cache
    if (selectedConversation) {
      setCachedMessages(selectedConversation._id, updatedMessages);
    }
    
    toast({
      title: "Success",
      description: "Message deleted successfully"
    });
    
    // Call API in background and update conversations
    try {
      await messageService.deleteMessage(messageId);
      // Refresh conversations to update last message
      fetchConversations();
    } catch (error: any) {
      // Silently handle or log error
      console.error("Delete message error:", error);
      // Optionally refresh to restore if failed
      if (selectedConversation) {
        fetchMessages(selectedConversation._id, false);
      }
    }
  };

  const canDeleteMessage = (messageDate: string): boolean => {
    const messageTime = new Date(messageDate).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - messageTime) <= twentyFourHours;
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
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

  const filteredConversations = (conversations || []).filter(conv =>
    conv && conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConnections = (connections || []).filter(conn =>
    conn && conn.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get connections that don't have conversations yet
  const availableConnections = filteredConnections.filter(conn => 
    !conversations.some(conv => conv.participant?._id === conn.user._id)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Personal Messages</h1>
        <p className="text-muted-foreground">
          Connect and communicate with fellow alumni
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-[700px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Messages</h2>
                <div className="flex gap-1">
                  {availableConnections.length > 0 && (
                    <Button 
                      variant={showConnections ? "default" : "ghost"} 
                      size="icon"
                      onClick={() => setShowConnections(!showConnections)}
                      title="Start new conversation"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={showConnections ? "Search connections..." : "Search messages..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[580px]">
                {showConnections ? (
                  <div className="space-y-1">
                    {availableConnections.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          {connections.length === 0 ? "No connections yet" : "All your connections have active conversations"}
                        </p>
                        {connections.length === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => navigate('/alumni')}
                          >
                            Browse Alumni
                          </Button>
                        )}
                      </div>
                    ) : (
                      availableConnections.map((connection) => (
                        <div
                          key={connection._id}
                          onClick={() => handleStartConversation(connection.user._id)}
                          className="flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={connection.user.avatar} />
                            <AvatarFallback className="bg-primary/20 text-primary font-medium">
                              {connection.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">
                              {connection.user.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              Click to start chat
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : conversations.length === 0 && connections.length > 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      No conversations yet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConnections(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      No conversations yet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/alumni')}
                    >
                      Browse Alumni
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation._id}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          setShowConnections(false);
                        }}
                        className={`flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedConversation?._id === conversation._id 
                            ? "bg-primary/10" 
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.participant?.avatar} />
                            <AvatarFallback className="bg-primary/20 text-primary font-medium">
                              {conversation.participant?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.lastMessage && 
                           !conversation.lastMessage.read && 
                           conversation.lastMessage.sender !== currentUser?._id && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="font-medium text-sm truncate">
                              {conversation.participant?.name}
                            </h3>
                            {conversation.lastMessageTime && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {getTimeAgo(conversation.lastMessageTime).replace(' ago', '')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          {selectedConversation ? (
            <Card className="lg:col-span-2 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConversation.participant?.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary font-medium">
                        {selectedConversation.participant?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.participant?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.participant?.currentPosition || "Active now"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pin className="mr-2 h-4 w-4" />
                        Pin conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isMe = message.sender._id === currentUser?._id;
                      const canDelete = isMe && canDeleteMessage(message.createdAt);
                      
                      // Debug logging
                      console.log('Message:', message.content, {
                        isMe,
                        canDelete,
                        senderId: message.sender._id,
                        currentUserId: currentUser?._id,
                        createdAt: message.createdAt
                      });
                      
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
                            {/* Dropdown menu for message actions */}
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
                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Message Input */}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="lg:col-span-2 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground text-sm">Choose a conversation from the list to start messaging</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
