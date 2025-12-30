import { TrendingUp, Users, Calendar, DollarSign, Activity, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { donationService } from "@/services/ApiServices";
import { toast } from "sonner";

interface Donor {
  _id: string;
  name: string;
  email: string;
  graduationYear?: string;
  campaign: string;
  amount: number;
  donatedAt: string;
  status: string;
}

export default function Analytics() {
  const [recentDonors, setRecentDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDonors();
  }, []);

  const fetchRecentDonors = async () => {
    try {
      setLoading(true);
      const response = await donationService.getRecentDonors();
      const donors = response?.data || [];
      // Get only the 5 most recent
      setRecentDonors(donors.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch recent donors:", error);
      toast.error("Failed to load recent donors");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/10 text-green-600';
      case 'pending':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Track engagement, growth, and community metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Total Alumni</p>
              <p className="stats-card-number">12,847</p>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +5.2% this month
              </p>
            </div>
            <Users className="stats-card-icon" />
          </div>
        </div>
        
        <div className="stats-card-teal">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Active Users</p>
              <p className="stats-card-number">3,421</p>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +12.1% this month
              </p>
            </div>
            <Activity className="stats-card-icon" />
          </div>
        </div>
        
        <div className="stats-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Events This Month</p>
              <p className="stats-card-number">23</p>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                6 upcoming
              </p>
            </div>
            <Calendar className="stats-card-icon" />
          </div>
        </div>
        
        <div className="stats-card-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Monthly Donations</p>
              <p className="stats-card-number">₹284K</p>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +18.3% this month
              </p>
            </div>
            <DollarSign className="stats-card-icon" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              User Engagement
            </CardTitle>
            <CardDescription>Monthly active users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Integration with chart library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Alumni Growth
            </CardTitle>
            <CardDescription>New alumni registrations by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Growth chart would go here</p>
                <p className="text-sm">Integration with chart library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Events</CardTitle>
            <CardDescription>Most popular events by attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Alumni Tech Summit 2024", attendees: 287, trend: "+15%" },
                { name: "Annual Gala Night", attendees: 245, trend: "+8%" },
                { name: "Healthcare Innovation Panel", attendees: 156, trend: "+22%" },
                { name: "Finance Networking Mixer", attendees: 134, trend: "+5%" },
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.attendees} attendees</p>
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    {event.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Alumni Activity</CardTitle>
            <CardDescription>Most engaged alumni this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Sarah Johnson '18", activity: "15 interactions", type: "Mentor" },
                { name: "Michael Chen '15", activity: "12 interactions", type: "Donor" },
                { name: "Emily Rodriguez '20", activity: "10 interactions", type: "Speaker" },
                { name: "David Kim '16", activity: "8 interactions", type: "Volunteer" },
              ].map((alumni, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {alumni.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{alumni.name}</p>
                      <p className="text-sm text-muted-foreground">{alumni.activity}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{alumni.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
          <CardDescription>Where our alumni are located</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { region: "North America", count: 8547, percentage: 66.5 },
              { region: "Europe", count: 2134, percentage: 16.6 },
              { region: "Asia Pacific", count: 1523, percentage: 11.9 },
              { region: "Other", count: 643, percentage: 5.0 },
            ].map((region) => (
              <div key={region.region} className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{region.count.toLocaleString()}</p>
                <p className="font-medium">{region.region}</p>
                <p className="text-sm text-muted-foreground">{region.percentage}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Donations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>Latest donation activity across all campaigns</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recentDonors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Donor</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Campaign</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonors.map((donor) => (
                    <tr key={donor._id} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(donor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{donor.name}</p>
                            <p className="text-sm text-muted-foreground">{donor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{donor.campaign}</p>
                          {donor.graduationYear && (
                            <p className="text-sm text-muted-foreground">Class of {donor.graduationYear}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-primary">{formatAmount(donor.amount)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm">{formatDate(donor.donatedAt)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(donor.status)}>
                          {donor.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent donations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}