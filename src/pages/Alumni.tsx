import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, MapPin, Briefcase, Calendar, Loader2, MessageCircle, UserPlus, UserCheck, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminService, userService, connectionService, handleApiError } from "@/services/ApiServices";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";

// Define the User interface to match your backend model
interface User {
  _id: string;
  name: string;
  email: string;
  graduationYear?: string | number;
  course?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Alumni() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [connectionStatuses, setConnectionStatuses] = useState<{ [key: string]: any }>({});
  const [loadingConnections, setLoadingConnections] = useState<{ [key: string]: boolean }>({});
  const { userType } = useAuth();
  const navigate = useNavigate();

  // Fetch alumni data using React Query
  const {
    data: alumniResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["public-alumni", userType],
    queryFn: async () => {
      try {
        // Use appropriate service based on user type
        const response = userType === 'admin' 
          ? await adminService.getAllUsers()
          : await userService.getAllUsers();
        
        return response;
      } catch (error: any) {
        const apiError = handleApiError(error);
        throw new Error(apiError.message);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Handle error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch alumni data",
        variant: "destructive",
      });
    }
  }, [error]);

  // Extract users from the API response - handle different response structures
  const getAllUsersFromResponse = (response: any): User[] => {
    // Try different possible response structures
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response?.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    }
    
    if (response?.users && Array.isArray(response.users)) {
      return response.users;
    }
    
    return [];
  };

  // Get all users first
  const allUsers: User[] = getAllUsersFromResponse(alumniResponse); 

  // Get current user ID from localStorage
  const currentUserId = localStorage.getItem('userId');

  // Filter for verified alumni only and exclude the current user
  const alumniData: User[] = allUsers.filter(user => {
    if (!user || !user.name || !user.email) {
      return false;
    }
    
    // Exclude the current user from the list
    if (currentUserId && user._id === currentUserId) {
      return false;
    }
    
    // Check for alumni role - be flexible with string comparison
    const userRole = user.role?.toLowerCase();
    return userRole === "alumni" || userRole === "alumnus";
  });

  // Get unique graduation years from the data
  const graduationYears = [...new Set(
    alumniData
      .map(person => {
        const year = person.graduationYear;
        if (year === null || year === undefined) return null;
        const yearStr = String(year);
        return yearStr.trim() !== "" ? yearStr : null;
      })
      .filter(year => year !== null)
  )].sort().reverse();

  // Get unique courses from the data
  const courses = [...new Set(
    alumniData
      .map(person => {
        const course = person.course;
        if (!course) return null;
        const courseStr = String(course);
        return courseStr.trim() !== "" ? courseStr : null;
      })
      .filter(course => course !== null)
  )].sort();

  const filteredAlumni = alumniData.filter(person => {
    const matchesSearch = person.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         person.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         person.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesYear = selectedYear === "all" || String(person.graduationYear) === selectedYear;
    const matchesIndustry = selectedIndustry === "all" || person.course === selectedIndustry;
    
    return matchesSearch && matchesYear && matchesIndustry;
  });

  // Fetch connection statuses for filtered alumni
  useEffect(() => {
    const fetchConnectionStatuses = async () => {
      for (const person of filteredAlumni) {
        try {
          const response = await connectionService.getConnectionStatus(person._id);
          if (response.success && response.data) {
            setConnectionStatuses(prev => ({
              ...prev,
              [person._id]: response.data
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch connection status for ${person._id}:`, error);
        }
      }
    };

    if (filteredAlumni.length > 0) {
      fetchConnectionStatuses();
    }
  }, [filteredAlumni.length]);

  // Handle connect button click
  const handleConnect = async (userId: string) => {
    try {
      setLoadingConnections(prev => ({ ...prev, [userId]: true }));
      const response = await connectionService.sendConnectionRequest(userId);
      
      if (response.success) {
        toast({
          title: "Connection request sent!",
          description: "Your request has been sent successfully.",
        });
        
        // Update connection status
        setConnectionStatuses(prev => ({
          ...prev,
          [userId]: { status: 'pending', isRequester: true }
        }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    } finally {
      setLoadingConnections(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Handle message button click - open chat dialog
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Search and Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-[160px]" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        <Skeleton className="h-5 w-48" />

        {/* Alumni Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !alumniResponse) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-destructive">Failed to load alumni data</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">Alumni Directory</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Connect with {alumniData.length}+ verified alumni across various fields
          </p>
        </div>
        <Button 
          onClick={() => navigate('/connections')}
          className="gap-2 w-full sm:w-auto"
          variant="outline"
        >
          <Users className="w-4 h-4" />
          My Connections
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, course, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Graduation Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {graduationYears.map(year => (
                <SelectItem key={year} value={year}>
                  Class of {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAlumni.length} of {alumniData.length} verified alumni
      </div>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlumni.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">
              {allUsers.length === 0 
                ? "No users found in the system" 
                : "No verified alumni found matching your criteria"
              }
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedYear("all");
                setSelectedIndustry("all");
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          filteredAlumni.map((person) => (
            <Card key={person._id} className="bento-card hover:shadow-md border-card-border/50 hover-lift group flex flex-col h-full">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="relative cursor-pointer" onClick={() => handleAvatarClick(person._id)}>
                    <Avatar className="w-16 h-16 ring-2 ring-primary/20 flex-shrink-0 hover:ring-4 transition-all">
                      <AvatarImage src={person.avatar} alt={person.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                        {person.name?.split(' ').map(n => n[0]).join('') || 'AL'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                      {person.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {person.graduationYear ? `Class of ${person.graduationYear}` : 'Graduate'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{person.course || 'N/A'}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{person.course || 'Course not specified'}</p>
                      <p className="text-muted-foreground">Alumni</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Graduated: {person.graduationYear || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">Alumni</Badge>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    Verified
                  </Badge>
                  {person.course && (
                    <Badge variant="outline" className="text-xs">
                      {person.course}
                    </Badge>
                  )}
                </div>

                <div className="pt-2 mt-auto">
                  {connectionStatuses[person._id] && connectionStatuses[person._id].status === 'accepted' ? (
                    <Button 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => handleMessage(person._id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                  ) : connectionStatuses[person._id] && connectionStatuses[person._id].status === 'pending' ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full gap-2"
                      disabled
                    >
                      <UserCheck className="w-4 h-4" />
                      Request Sent
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => handleConnect(person._id)}
                      disabled={loadingConnections[person._id]}
                    >
                      {loadingConnections[person._id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredAlumni.length > 0 && (
        <div className="text-center pt-6">
          <Button variant="outline" size="lg" onClick={() => refetch()}>
            Refresh Data
          </Button>
        </div>
      )}
      
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