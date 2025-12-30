import { useState, useEffect } from "react";
import { UserPlus, UserCheck, UserX, Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { connectionService } from "@/services/ApiServices";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";

export default function Connections() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [myConnections, setMyConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, connectionsRes] = await Promise.all([
        connectionService.getPendingRequests(),
        connectionService.getConnections({ status: 'accepted' })
      ]);

      // Backend returns ApiResponse: { statusCode, data, message, success }
      setPendingRequests(pendingRes?.data || []);
      setMyConnections(connectionsRes?.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [connectionId]: true }));
      await connectionService.acceptConnectionRequest(connectionId);

      toast({
        title: "Connection accepted!",
        description: "You are now connected.",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept connection",
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [connectionId]: true }));
      await connectionService.rejectConnectionRequest(connectionId);

      toast({
        title: "Connection rejected",
        description: "Request has been declined.",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject connection",
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  const handleMessage = (userId: string) => {
    setSelectedUserId(userId);
    setChatDialogOpen(true);
  };

  const handleAvatarClick = (userId: string) => {
    setSelectedProfileId(userId);
    setProfileDialogOpen(true);
  };

  const getUserInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Connections</h1>
        <p className="text-muted-foreground">
          Manage your alumni network connections
        </p>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="requests" className="gap-2 relative">
            <UserPlus className="w-4 h-4" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge className="ml-1 px-1.5 min-w-[20px] h-5" variant="destructive">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-2">
            <UserCheck className="w-4 h-4" />
            My Connections
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Connection Requests
              </CardTitle>
              <CardDescription>
                {pendingRequests.length === 0 
                  ? "No pending requests" 
                  : `${pendingRequests.length} ${pendingRequests.length === 1 ? 'person wants' : 'people want'} to connect with you`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No pending connection requests</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/alumni')}
                  >
                    Browse Alumni
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="relative cursor-pointer" onClick={() => handleAvatarClick(request.requester?._id)}>
                        <Avatar className="w-12 h-12 hover:ring-4 ring-primary/20 transition-all">
                          <AvatarImage src={request.requester?.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getUserInitials(request.requester?.name || 'User')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{request.requester?.name || 'Anonymous'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.requester?.currentPosition || 'Alumni'}
                          {request.requester?.graduationYear && ` • Class of ${request.requester.graduationYear}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{request.requester?.email}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request._id)}
                          disabled={actionLoading[request._id]}
                          className="gap-2"
                        >
                          {actionLoading[request._id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request._id)}
                          disabled={actionLoading[request._id]}
                          className="gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Connections */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                My Connections
              </CardTitle>
              <CardDescription>
                {myConnections.length === 0 
                  ? "No connections yet" 
                  : `${myConnections.length} ${myConnections.length === 1 ? 'connection' : 'connections'}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myConnections.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No connections yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/alumni')}
                  >
                    Browse Alumni
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myConnections.map((connection) => (
                    <div
                      key={connection._id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="relative cursor-pointer" onClick={() => handleAvatarClick(connection.user?._id)}>
                        <Avatar className="w-12 h-12 hover:ring-4 ring-primary/20 transition-all">
                          <AvatarImage src={connection.user?.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getUserInitials(connection.user?.name || 'User')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{connection.user?.name || 'Anonymous'}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {connection.user?.currentPosition || 'Alumni'}
                        </p>
                        {connection.user?.graduationYear && (
                          <p className="text-xs text-muted-foreground">
                            Class of {connection.user.graduationYear}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 mt-2 gap-2"
                          onClick={() => handleMessage(connection.user._id)}
                        >
                          <Mail className="w-3 h-3" />
                          Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Chat Dialog */}
      <ChatDialog 
        open={chatDialogOpen} 
        onOpenChange={setChatDialogOpen}
        userId={selectedUserId || undefined}
      />
      
      {/* User Profile Dialog */}
      <UserProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen}
        userId={selectedProfileId}
        onMessageClick={(userId) => {
          setSelectedUserId(userId);
          setChatDialogOpen(true);
        }}
      />
    </div>
  );
}
