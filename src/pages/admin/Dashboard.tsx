import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, DollarSign, TrendingUp, UserCheck, Mail, Award, ArrowUpRight, Loader2, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { adminService, eventService, donationService, jobService, handleApiError } from "@/services/ApiServices";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

const DEPARTMENT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300',
  '#00ff88', '#ff6b6b', '#4ecdc4', '#45b7d1',
  '#96ceb4', '#ffeaa7', '#fab1a0', '#fd79a8'
];

export function Dashboard() {
  const [totalAlumni, setTotalAlumni] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [donationStats, setDonationStats] = useState<any>(null);
  const [verifiedJobs, setVerifiedJobs] = useState<number>(0);
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [recentDonors, setRecentDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  // Helper function to format time ago
  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return past.toLocaleDateString();
  };

  // Fetch dashboard data with better error handling
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Declare variables at function scope
        let alumni: any[] = [];
        let events: any[] = [];
        let donors: any[] = [];

        // Fetch alumni data with proper response handling
        try {
          const alumniResponse = await adminService.getAllUsers();
          
          // Extract data from the response object
          alumni = Array.isArray(alumniResponse?.data) 
            ? alumniResponse.data 
            : [];
          
          setTotalAlumni(alumni.length);

          // Process department data safely
          const courseCounts = alumni.reduce((acc: any, user: any) => {
            const course = user?.course || 'Not Specified';
            acc[course] = (acc[course] || 0) + 1;
            return acc;
          }, {});

          const chartData = Object.entries(courseCounts).map(([name, value], index) => ({
            name,
            value: value as number,
            color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]
          }));

          setDepartmentData(chartData);
        } catch (alumniError) {
          console.warn('Failed to fetch alumni data:', alumniError);
          setTotalAlumni(0);
          setDepartmentData([]);
        }

        // Fetch events data with fallback
        try {
          const eventsResponse = await eventService.getEvents();
          events = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
          setTotalEvents(events.length);
        } catch (eventsError) {
          console.warn('Failed to fetch events data:', eventsError);
          setTotalEvents(0);
        }

        // Fetch donation stats
        try {
          const donationStatsResponse = await donationService.getDonationStats();
          const stats = donationStatsResponse?.data || {};
          setDonationStats(stats);
        } catch (donationError) {
          console.warn('Failed to fetch donation stats:', donationError);
          setDonationStats(null);
        }

        // Note: Using donationService because it provides stats endpoint
        // adminService.getAllDonations only returns campaign list

        // Fetch jobs data
        try {
          const jobsResponse = await jobService.getAllJobs();
          const jobs = jobsResponse?.data || [];
          setTotalJobs(Array.isArray(jobs) ? jobs.length : 0);
          
          // Count verified jobs
          const verified = Array.isArray(jobs) 
            ? jobs.filter((job: any) => job.isVerified === true).length 
            : 0;
          setVerifiedJobs(verified);
        } catch (jobsError) {
          console.warn('Failed to fetch jobs data:', jobsError);
          setTotalJobs(0);
          setVerifiedJobs(0);
        }

        // Fetch recent donors for activity feed
        try {
          const donorsResponse = await donationService.getRecentDonors();
          donors = Array.isArray(donorsResponse?.data) ? donorsResponse.data : [];
          setRecentDonors(donors.slice(0, 10));
        } catch (donorsError) {
          console.warn('Failed to fetch recent donors:', donorsError);
          setRecentDonors([]);
        }

        // Build recent activities from various sources
        const activities: any[] = [];

        // Add recent alumni (last 2 with unique entries)
        if (alumni.length > 0) {
          const sortedAlumni = [...alumni]
            .filter((user: any) => user.createdAt)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2);
          
          sortedAlumni.forEach((user: any) => {
            const details = [];
            if (user.graduationYear) details.push(`Class of ${user.graduationYear}`);
            if (user.course) details.push(user.course);
            if (user.currentPosition) details.push(user.currentPosition);
            
            activities.push({
              id: `alumni-${user._id}`,
              type: 'new_member',
              title: 'New Alumni Registration',
              description: `${user.name}${details.length > 0 ? ` - ${details.join(' • ')}` : ''} joined the network`,
              time: user.createdAt,
              icon: UserCheck,
            });
          });
        }

        // Add recent events (last 2)
        if (events.length > 0) {
          const sortedEvents = [...events]
            .filter((event: any) => event.createdAt)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2);
          
          sortedEvents.forEach((event: any) => {
            const details = [];
            if (event.location) details.push(event.location);
            if (event.eventDate) {
              const eventDate = new Date(event.eventDate);
              details.push(eventDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
            }
            if (event.participants?.length) details.push(`${event.participants.length} registered`);
            
            activities.push({
              id: `event-${event._id}`,
              type: 'event',
              title: event.title || 'New Event',
              description: details.length > 0 ? details.join(' • ') : (event.description?.substring(0, 50) || 'Event scheduled'),
              time: event.createdAt,
              icon: Calendar,
            });
          });
        }

        // Add recent donations (last 3 unique donors)
        if (donors.length > 0) {
          const uniqueDonors = donors
            .filter((donor: any, index: number, self: any[]) => 
              index === self.findIndex((d: any) => d.name === donor.name && d.campaign === donor.campaign)
            )
            .slice(0, 3);
          
          uniqueDonors.forEach((donor: any) => {
            activities.push({
              id: `donation-${donor._id}`,
              type: 'donation',
              title: 'New Donation Received',
              description: `${donor.name || 'Anonymous'} donated ${formatCurrency(donor.amount)} to ${donor.campaign || 'General Fund'}`,
              time: donor.donatedAt || new Date(),
              icon: DollarSign,
            });
          });
        }

        // Sort all activities by time and take top 8
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setRecentActivities(activities.slice(0, 8));

      } catch (error: any) {
        console.error('Dashboard data fetch error:', error);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Safe render functions with null checks
  const renderCustomLabel = (entry: any) => {
    try {
      if (!departmentData || departmentData.length === 0) return '';
      const total = departmentData.reduce((sum, item) => sum + (item?.value || 0), 0);
      if (total === 0) return '';
      const percent = ((entry?.value || 0) / total * 100).toFixed(1);
      return `${percent}%`;
    } catch (err) {
      console.warn('Error rendering custom label:', err);
      return '';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    try {
      if (active && payload && payload.length && payload[0]?.payload) {
        const data = payload[0].payload;
        return (
          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
            <p className="font-medium">{data.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              Alumni: <span className="font-semibold text-foreground">{data.value || 0}</span>
            </p>
          </div>
        );
      }
    } catch (err) {
      console.warn('Error rendering tooltip:', err);
    }
    return null;
  };

  // Error boundary fallback
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8 pb-0">
        {/* Header Skeleton */}
        <div className="animate-fade-in">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96 rounded-lg" />
              <Skeleton className="h-96 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[700px] rounded-lg" />
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }


  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-0">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Welcome back! Here's what's happening with your alumni network.
        </p>
      </div>

      {/* KPI Grid - Bento Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-slide-up">
        <div className="stats-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Total Alumni</p>
              <p className="stats-card-number">{totalAlumni.toLocaleString()}</p>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <UserCheck className="w-3 h-3" />
                {departmentData.length} department{departmentData.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Users className="stats-card-icon" />
          </div>
        </div>

        <div className="stats-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Total Events</p>
              <p className="stats-card-number">{totalEvents.toString()}</p>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                Scheduled & completed
              </p>
            </div>
            <Calendar className="stats-card-icon" />
          </div>
        </div>

        <div className="stats-card-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Total Donations</p>
              <p className="stats-card-number">
                {formatCurrency(donationStats?.totalRaised || 0)}
              </p>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" />
                {donationStats?.totalCampaigns || 0} campaign{donationStats?.totalCampaigns !== 1 ? 's' : ''}
              </p>
            </div>
            <DollarSign className="stats-card-icon" />
          </div>
        </div>

        <div className="stats-card-teal">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Verified Jobs</p>
              <p className="stats-card-number">{verifiedJobs.toLocaleString()}</p>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <Award className="w-3 h-3" />
                {totalJobs} total postings
              </p>
            </div>
            <Award className="stats-card-icon" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Quick Actions - Larger Bento Card */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="bento-card gradient-surface border-card-border/50">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Frequently used management tools
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                <Button onClick={() => navigate('/admin/alumni')} variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 hover:text-orange-800 dark:bg-orange-950 dark:hover:bg-orange-900 dark:border-orange-800 dark:text-orange-300 dark:hover:text-orange-200 transition-smooth">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs sm:text-sm">Alumni</span>
                </Button>
                <Button onClick={() => navigate('/admin/events')} variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-800 dark:text-blue-300 dark:hover:text-blue-200 transition-smooth">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs sm:text-sm">Events</span>
                </Button>
                <Button onClick={() => navigate('/admin/communications')} variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700 hover:text-teal-800 dark:bg-teal-950 dark:hover:bg-teal-900 dark:border-teal-800 dark:text-teal-300 dark:hover:text-teal-200 transition-smooth">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs sm:text-sm">Messages</span>
                </Button>
                <Button onClick={() => navigate('/admin/donations')} variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700 hover:text-pink-800 dark:bg-pink-950 dark:hover:bg-pink-900 dark:border-pink-800 dark:text-pink-300 dark:hover:text-pink-200 transition-smooth">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 dark:text-pink-400" />
                  <span className="text-xs sm:text-sm">Donations</span>
                </Button>
                <Button onClick={() => navigate('/admin/jobs')} variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 hover:text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:border-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 transition-smooth">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs sm:text-sm">Jobs</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bento-card gradient-surface border-card-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Alumni by Department
                </CardTitle>
                <CardDescription>
                  Distribution of alumni across different departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {departmentData && departmentData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departmentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry?.color || DEPARTMENT_COLORS[0]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No department data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Department Statistics with safer rendering */}
            <Card className="bento-card gradient-surface border-card-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Department Statistics
                </CardTitle>
                <CardDescription>
                  Detailed breakdown by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                {departmentData && departmentData.length > 0 ? (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {departmentData
                      .sort((a, b) => (b?.value || 0) - (a?.value || 0))
                      .map((dept, index) => {
                        if (!dept) return null;
                        
                        const total = departmentData.reduce((sum, item) => sum + (item?.value || 0), 0);
                        const percentage = total > 0 ? ((dept.value / total) * 100).toFixed(1) : '0.0';

                        return (
                          <div key={dept.name || index} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-smooth">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: dept.color || DEPARTMENT_COLORS[0] }}
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground">{dept.name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {percentage}% of total
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {dept.value || 0}
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="h-60 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No department data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bento-card gradient-surface border-card-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  if (!activity) return null;
                  
                  return (
                    <div
                      key={activity.id || index}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition-smooth animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 150}ms` }}
                      onClick={() => {
                        if (activity.type === 'new_member') navigate('/admin/alumni');
                        else if (activity.type === 'event') navigate('/admin/events');
                        else if (activity.type === 'donation') navigate('/admin/donations');
                      }}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        {activity.icon && <activity.icon className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.title || 'Unknown Activity'}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activity.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {activity.time ? getTimeAgo(activity.time) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary hover:bg-primary/10">
              View All Activities
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Donation Trends Section with safe rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bento-card gradient-surface border-card-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Recent Donation Activity
            </CardTitle>
            <CardDescription>
              Latest contributions from donors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentDonors && recentDonors.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentDonors.slice(0, 6).map((donor: any, index: number) => (
                  <div key={donor._id || index} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 hover:bg-accent/40 transition-smooth">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {donor.name || 'Anonymous Donor'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {donor.campaign || 'General Fund'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {donor.donatedAt ? getTimeAgo(donor.donatedAt) : 'Recently'}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(donor.amount || 0)}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {donor.status || 'completed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent donations</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bento-card gradient-surface border-card-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Events scheduled in the coming weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalEvents > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-primary opacity-70" />
                  <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
                  <p className="text-sm text-muted-foreground mt-2">Total Events</p>
                  <Button 
                    onClick={() => navigate('/admin/events')} 
                    variant="outline" 
                    className="mt-4"
                  >
                    View All Events
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Donation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bento-card gradient-surface border-card-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(donationStats?.totalRaised || 0)}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  {donationStats?.campaignGoalPercentage 
                    ? `${Math.round(donationStats.campaignGoalPercentage)}% of goal`
                    : 'No active campaigns'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bento-card gradient-surface border-card-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Donors</p>
                <p className="text-2xl font-bold text-foreground">
                  {donationStats?.activeDonors?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  Active contributors
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bento-card gradient-surface border-card-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Donation</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(donationStats?.avgDonation || 0)}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  Per donor contribution
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}