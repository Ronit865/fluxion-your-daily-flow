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

  // Data-only skeleton component - static UI renders immediately
  const AlumniCardsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className="rounded-2xl bg-card border border-border/50 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="flex gap-2.5">
            <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-32" />
              <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 sm:h-3 w-12" />
            <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-36" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 sm:h-3 w-10" />
            <Skeleton className="h-2.5 sm:h-3 w-36 sm:w-44" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 sm:h-3 w-14" />
            <Skeleton className="h-3 sm:h-3.5 w-20 sm:w-24" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-full rounded-lg mt-2" />
        </div>
      ))}
    </div>
  );

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

      {/* Alumni Grid - Show skeleton or data */}
      {isLoading ? (
        <AlumniCardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            <Card key={person._id} className="overflow-hidden border-border/30 bg-card flex flex-col h-full group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2 pt-4 px-4">
                {/* Avatar and Name */}
                <div className="flex gap-2.5 mb-2">
                  <div className="relative cursor-pointer flex-shrink-0" onClick={() => handleAvatarClick(person._id)}>
                    <Avatar className="w-14 h-14 rounded-lg ring-2 ring-primary/20 group-hover:ring-4 transition-all">
                      <AvatarImage src={person.avatar} alt={person.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-sm rounded-lg">
                        {person.name?.split(' ').map(n => n[0]).join('') || 'AL'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {person.name || 'Unknown'}
                    </h3>
                    <p className="text-xs text-muted-foreground">Graduated {person.graduationYear || 'N/A'}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col px-4 pb-4 space-y-2">
                {/* Course */}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Course</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{person.course || "-"}</p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="text-xs font-medium text-foreground truncate hover:text-primary transition-colors cursor-pointer" title={person.email || "-"}>
                    {person.email || "-"}
                  </p>
                </div>

                {/* Company */}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Company</p>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{(person as any).company || "-"}</p>
                </div>

                {/* Action Button */}
                <div className="mt-auto pt-3">
                  {connectionStatuses[person._id] && connectionStatuses[person._id].status === 'accepted' ? (
                    <Button 
                      size="sm" 
                      className="w-full font-semibold gap-2"
                      onClick={() => handleMessage(person._id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                  ) : connectionStatuses[person._id] && connectionStatuses[person._id].status === 'pending' ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full font-semibold gap-2"
                      disabled
                    >
                      <UserCheck className="w-4 h-4" />
                      Request Sent
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full font-semibold gap-2"
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
      )}

      {/* Load More */}
      {!isLoading && filteredAlumni.length > 0 && (
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