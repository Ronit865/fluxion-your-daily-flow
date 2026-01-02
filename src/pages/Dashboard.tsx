import { Calendar, Users, Briefcase, TrendingUp, Heart, MessageCircle, Loader2 } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, eventService, userService, jobService, donationService, connectionService, communicationService } from "@/services/ApiServices";
import { toast } from "sonner";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

interface DashboardStats {
  totalAlumni: number;
  totalEvents: number;
  activeEvents: number;
  totalDonations: string;
  totalJobs: number;
  totalConnections: number;
}

interface DonationStats {
  totalRaised: number;
  activeDonors: number;
  avgDonation: number;
  campaignGoalPercentage: number;
  totalGoal: number;
  totalCampaigns: number;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  isactive: boolean;
  participants: string[];
}

interface Alumni {
  _id: string;
  name: string;
  email: string;
  role?: string;
  graduationYear?: string;
  course?: string;
  isVerified?: boolean;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  salary: number;
  location?: string;
}

interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
  };
  createdAt: string;
}
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAlumni: 0,
    totalEvents: 0,
    activeEvents: 0,
    totalDonations: "₹0",
    totalJobs: 0,
    totalConnections: 0
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [featuredAlumni, setFeaturedAlumni] = useState<Alumni[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [donationStats, setDonationStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      // Check cache first for instant loading
      const cachedData = cache.get<{
        stats: typeof stats;
        recentEvents: typeof recentEvents;
        featuredAlumni: typeof featuredAlumni;
        recentJobs: typeof recentJobs;
        recentPosts: typeof recentPosts;
        donationStats: typeof donationStats;
      }>(CACHE_KEYS.DASHBOARD_DATA);

      if (cachedData && !forceRefresh) {
        // Use cached data immediately
        setStats(cachedData.stats);
        setRecentEvents(cachedData.recentEvents);
        setFeaturedAlumni(cachedData.featuredAlumni);
        setRecentJobs(cachedData.recentJobs);
        setRecentPosts(cachedData.recentPosts);
        setDonationStats(cachedData.donationStats);
        setLoading(false);
        
        // Refresh in background if cache is older than 2 minutes
        if (cache.getTTL(CACHE_KEYS.DASHBOARD_DATA) < CACHE_TTL.MEDIUM - 120) {
          fetchDashboardData(true);
        }
        return;
      }

      setLoading(true);

      // Fetch alumni data
      const alumniResponse = await userService.getAllUsers();
      
      // Extract data from the response object properly
      const allUsers = Array.isArray(alumniResponse?.data) 
        ? alumniResponse.data 
        : [];
      
      // Filter verified alumni
      const verifiedAlumni = allUsers.filter((user: Alumni) => {
        return user.role?.toLowerCase() === "alumni";
      });

      // Fetch events data
      const eventsResponse = await eventService.getEvents();
      
      const allEvents = eventsResponse?.success && Array.isArray(eventsResponse.data) 
        ? eventsResponse.data 
        : [];
      
      // Filter active events
      const activeEvents = allEvents.filter((event: Event) => event.isactive);
      
      // Get upcoming events (next 3)
      const upcomingEvents = activeEvents
        .filter((event: Event) => new Date(event.date) >= new Date())
        .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

      // Get featured alumni (random sample)
      const featured = verifiedAlumni
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      // Fetch jobs data
      let jobs: Job[] = [];
      try {
        const jobsResponse = await jobService.getAllJobs();
        jobs = Array.isArray(jobsResponse?.data) ? jobsResponse.data : [];
        const verifiedJobs = jobs.filter((job: any) => job.isVerified);
        setRecentJobs(verifiedJobs.slice(0, 5));
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }

      // Fetch donation stats
      let donationAmount = "₹0";
      try {
        const donationResponse = await donationService.getDonationStats();
        if (donationResponse?.data) {
          const stats = donationResponse.data;
          setDonationStats(stats);
          const amount = stats.totalRaised || 0;
          donationAmount = amount >= 100000 
            ? `₹${(amount / 100000).toFixed(1)}L`
            : amount >= 1000
            ? `₹${(amount / 1000).toFixed(1)}k`
            : `₹${amount.toLocaleString()}`;
        }
      } catch (error) {
        console.error("Error fetching donations:", error);
      }

      // Fetch connections count
      let connectionsCount = 0;
      try {
        const connectionsResponse = await connectionService.getConnections({ status: 'accepted' });
        if (connectionsResponse?.data) {
          connectionsCount = Array.isArray(connectionsResponse.data) 
            ? connectionsResponse.data.length 
            : 0;
        }
      } catch (error) {
        // silently handle error
      }

      // Fetch recent posts
      try {
        const postsResponse = await communicationService.getAllPosts();
        
        // Handle different possible response structures
        let allPosts = [];
        if (postsResponse?.data) {
          if (Array.isArray(postsResponse.data)) {
            allPosts = postsResponse.data;
          } else if (postsResponse.data.posts && Array.isArray(postsResponse.data.posts)) {
            allPosts = postsResponse.data.posts;
          }
        } else if (Array.isArray(postsResponse)) {
          allPosts = postsResponse;
        }
        
        setRecentPosts(allPosts.slice(0, 3));
      } catch (error) {
        setRecentPosts([]);
      }

      const newStats = {
        totalAlumni: verifiedAlumni.length,
        totalEvents: allEvents.length,
        activeEvents: activeEvents.length,
        totalDonations: donationAmount,
        totalJobs: jobs.filter((job: any) => job.isVerified).length,
        totalConnections: connectionsCount
      };

      setStats(newStats);
      setRecentEvents(upcomingEvents);
      setFeaturedAlumni(featured);

      // Cache the dashboard data for faster subsequent loads
      cache.set(CACHE_KEYS.DASHBOARD_DATA, {
        stats: newStats,
        recentEvents: upcomingEvents,
        featuredAlumni: featured,
        recentJobs: jobs.filter((job: any) => job.isVerified).slice(0, 5),
        recentPosts: recentPosts,
        donationStats: donationStats
      }, CACHE_TTL.MEDIUM);

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getAlumniInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Skeleton only for data sections, static UI renders immediately
  const StatsGridSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="rounded-2xl p-4 sm:p-5 bg-card border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 sm:w-20" />
              <Skeleton className="h-7 sm:h-8 w-12 sm:w-16" />
            </div>
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  const ContentSkeleton = () => (
    <>
      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border/50 p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms' }}>
          <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 sm:w-48" />
                  <Skeleton className="h-3 w-24 sm:w-32" />
                </div>
                <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-border/50 p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '200ms' }}>
          <Skeleton className="h-5 sm:h-6 w-28 sm:w-36 mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20 sm:w-28" />
                  <Skeleton className="h-3 w-16 sm:w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="rounded-2xl bg-card border border-border/50 p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ animationDelay: `${250 + i * 50}ms` }}
          >
            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32 mb-3 sm:mb-4" />
            <div className="space-y-2 sm:space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <Skeleton className="h-3 sm:h-4 w-full mb-1 sm:mb-2" />
                  <Skeleton className="h-2 sm:h-3 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Hero Section - Always shown */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 sm:p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            Welcome to AllyNet
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-primary-foreground/90 mb-4 sm:mb-6 max-w-2xl">
            Connect, engage, and grow with our vibrant alumni community. Discover events, 
            opportunities, and meaningful connections that last a lifetime.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button onClick={() => navigate('/communications')} size="default" className="bg-white text-primary hover:bg-white/90 text-sm sm:text-base">
              Explore Community
            </Button>
            <Button onClick={() => navigate('/events')} size="default" className="bg-white text-primary hover:bg-white/90 text-sm sm:text-base">
              Join Events
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-white/10 rounded-full -translate-y-16 sm:-translate-y-24 md:-translate-y-32 translate-x-16 sm:translate-x-24 md:translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-24 sm:w-36 md:w-48 h-24 sm:h-36 md:h-48 bg-white/5 rounded-full translate-y-12 sm:translate-y-18 md:translate-y-24 -translate-x-12 sm:-translate-x-18 md:-translate-x-24"></div>
      </div>

      {/* Stats Grid - Show skeleton or data */}
      {loading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="stats-card-orange">
            <div className="flex items-center justify-between">
              <div>
                <p className="stats-card-label">Total Alumni</p>
                <p className="stats-card-number">{stats.totalAlumni.toLocaleString()}</p>
              </div>
              <Users className="stats-card-icon" />
            </div>
          </div>
          <div className="stats-card-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="stats-card-label">Active Events</p>
                <p className="stats-card-number">{stats.activeEvents}</p>
              </div>
              <Calendar className="stats-card-icon" />
            </div>
          </div>
          <div className="stats-card-teal">
            <div className="flex items-center justify-between">
              <div>
                <p className="stats-card-label">Total Events</p>
                <p className="stats-card-number">{stats.totalEvents}</p>
              </div>
              <Briefcase className="stats-card-icon" />
            </div>
          </div>
          <div className="stats-card-pink">
            <div className="flex items-center justify-between">
              <div>
                <p className="stats-card-label">Donations</p>
                <p className="stats-card-number">{stats.totalDonations}</p>
              </div>
              <Heart className="stats-card-icon" />
            </div>
          </div>
        </div>
      )}

      {/* Content - Show skeleton or data */}
      {loading ? (
        <ContentSkeleton />
      ) : (
        <>

      {/* Bento Grid - Fixed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upcoming Events (Takes 2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <BentoCard 
            title="Upcoming Events" 
            description="Don't miss these exciting opportunities"
            size="lg" 
            gradient
            className="h-full"
          >
            <div className="space-y-4">
              {recentEvents.length > 0 ? (
                recentEvents.map((event, index) => (
                  <div key={event._id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatEventDate(event.date)} • {event.location || 'Location TBD'}
                      </p>
                    </div>
                    <Badge variant={index % 3 === 0 ? "default" : index % 3 === 1 ? "secondary" : "outline"}>
                      Event
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No upcoming events</p>
              )}
              <Button 
                className="w-full mt-4" 
                onClick={() => navigate('/events')}
              >
                View All Events
              </Button>
            </div>
          </BentoCard>
        </div>

        {/* Right Column - Alumni Spotlight */}
        <div className="lg:col-span-1">
          <BentoCard 
            title="Alumni Spotlight" 
            description="Celebrating our community achievements"
            size="md"
            className="h-full"
          >
            <div className="space-y-4">
              {featuredAlumni.length > 0 ? (
                featuredAlumni.map((alumni) => (
                  <div key={alumni._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {getAlumniInitials(alumni.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {alumni.name} {alumni.graduationYear && `'${String(alumni.graduationYear).slice(-2)}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {alumni.course || 'Alumni'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No featured alumni</p>
              )}
            </div>
          </BentoCard>
        </div>
      </div>


      {/* Second Row - Four Equal Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <BentoCard 
          title="Job Opportunities" 
          description="Latest career opportunities"
          size="md"
          className="h-full"
        >
          <div className="space-y-3">
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div key={job._id} className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm">{job.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {job.company} • ₹{(job.salary / 1000).toFixed(0)}k
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No jobs available</p>
            )}
            <Button onClick={() => navigate('/jobs')} size="sm" className="w-full mt-2">
              View All Jobs
            </Button>
          </div>
        </BentoCard>

        <BentoCard 
          title="Top Companies" 
          description="Where our alumni thrive"
          size="md"
          className="h-full"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center p-3 rounded-lg hover:bg-muted/50 transition-colors text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
                <img 
                  src="https://logos-world.net/wp-content/uploads/2020/09/Tata-Consultancy-Services-TCS-Logo.png" 
                  alt="TCS Logo" 
                  className="w-10 h-7 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-blue-600 font-bold text-sm hidden">TCS</span>
              </div>
              <p className="font-medium text-xs mb-1">TCS</p>
              <p className="text-xs text-muted-foreground">250+ alumni</p>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg hover:bg-muted/50 transition-colors text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
                <img 
                  src="https://logos-world.net/wp-content/uploads/2020/06/Infosys-Logo.png" 
                  alt="Infosys Logo" 
                  className="w-10 h-7 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-blue-600 font-bold text-sm hidden">INF</span>
              </div>
              <p className="font-medium text-xs mb-1">Infosys</p>
              <p className="text-xs text-muted-foreground">180+ alumni</p>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg hover:bg-muted/50 transition-colors text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
                <img 
                  src="https://logos-world.net/wp-content/uploads/2020/09/Google-Logo.png" 
                  alt="Google Logo" 
                  className="w-9 h-9 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-blue-600 font-bold text-sm hidden">G</span>
              </div>
              <p className="font-medium text-xs mb-1">Google</p>
              <p className="text-xs text-muted-foreground">45+ alumni</p>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg hover:bg-muted/50 transition-colors text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
                <img 
                  src="https://logos-world.net/wp-content/uploads/2020/09/Microsoft-Logo.png" 
                  alt="Microsoft Logo" 
                  className="w-10 h-7 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-blue-600 font-bold text-sm hidden">MS</span>
              </div>
              <p className="font-medium text-xs mb-1">Microsoft</p>
              <p className="text-xs text-muted-foreground">38+ alumni</p>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg hover:bg-muted/50 transition-colors text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
                <img 
                  src="https://logos-world.net/wp-content/uploads/2020/07/IBM-Logo.png" 
                  alt="IBM Logo" 
                  className="w-10 h-7 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-blue-800 font-bold text-sm hidden">IBM</span>
              </div>
              <p className="font-medium text-xs mb-1">IBM</p>
              <p className="text-xs text-muted-foreground">95+ alumni</p>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg hover:bg-muted/50 transition-colors text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
                <img 
                  src="https://logos-world.net/wp-content/uploads/2020/09/Wipro-Logo.png" 
                  alt="Wipro Logo" 
                  className="w-10 h-7 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-purple-600 font-bold text-sm hidden">WP</span>
              </div>
              <p className="font-medium text-xs mb-1">Wipro</p>
              <p className="text-xs text-muted-foreground">120+ alumni</p>
            </div>
          </div>
        </BentoCard>

        <BentoCard 
          title="Community Chat" 
          description="Recent conversations"
          size="md"
          className="h-full"
        >
          <div className="space-y-4">
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <div key={post._id} className="flex items-start space-x-3 p-2 rounded-lg">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{post.author?.name || 'Alumni'}</p>
                    <p className="text-sm line-clamp-2">{post.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent posts</p>
            )}
            <Button onClick={() => navigate('/communications')} size="sm" className="w-full">
              Join Conversation
            </Button>
          </div>
        </BentoCard>

        <BentoCard 
          title="Donation Impact" 
          description="Making a difference together"
          size="md"
          className="h-full"
        >
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.totalDonations}</p>
              <p className="text-sm text-muted-foreground">Raised this year</p>
            </div>
            {donationStats ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Campaign Progress</span>
                    <span>{donationStats.campaignGoalPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(donationStats.campaignGoalPercentage, 100)}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-primary">{donationStats.activeDonors}</p>
                    <p className="text-xs text-muted-foreground">Active Donors</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-primary">{donationStats.totalCampaigns}</p>
                    <p className="text-xs text-muted-foreground">Campaigns</p>
                  </div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Average Donation</p>
                  <p className="text-lg font-bold text-primary">₹{donationStats.avgDonation.toFixed(0)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Loading...</span>
                    <span>--</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            )}
            <Button onClick={() => navigate('/donations')} className="w-full">Support a Cause</Button>
          </div>
        </BentoCard>
      </div>
      </>
      )}
    </div>
  );
}