import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, TrendingUp, Users, Target, ArrowUpRight, Clock, Plus, Loader2, ChevronLeft, ChevronRight, CheckCircle, MoreVertical, Trash2, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { donationService, handleApiError } from "@/services/ApiServices";
import { useToast } from "@/hooks/use-toast";

// Keep the static data for stats (will be replaced with API data)
// Removed static donationStats and recentDonations arrays - now using API data

// Enhanced interface for campaign data from backend - matching user side
interface Campaign {
    _id: string;
    name: string;
    description: string;
    goal: number;
    raised?: number;
    raisedAmount?: number;
    donors?: number | any[]; // Can be either number or array
    donorCount?: number;
    donorsCount?: number;
    numberOfDonors?: number;
    donations?: any[]; // Array of donation records
    endDate?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    category?: string;
}

interface CreateCampaignForm {
    name: string;
    description: string;
    goal: string;
    endDate: string;
    category: string;
}

// Add new interface for donor data
interface Donor {
    _id: string;
    name: string;
    email: string;
    amount: number;
    date: string;
    avatar?: string;
}

const ITEMS_PER_PAGE = 6;

export function Donations() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<CreateCampaignForm>({
        name: "",
        description: "",
        goal: "",
        endDate: "",
        category: ""
    });
    const [formErrors, setFormErrors] = useState<Partial<CreateCampaignForm>>({});
    const [selectedCampaignDonors, setSelectedCampaignDonors] = useState<Donor[]>([]);
    const [loadingDonors, setLoadingDonors] = useState(false);
    const [isDonorsDialogOpen, setIsDonorsDialogOpen] = useState(false);
    const [selectedCampaignName, setSelectedCampaignName] = useState("");
    const [donationStats, setDonationStats] = useState<any>(null);
    const [recentDonors, setRecentDonors] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [activePage, setActivePage] = useState(0);
    const [completedPage, setCompletedPage] = useState(0);
    const { toast: toastHook } = useToast();

    // Get featured campaigns (campaigns that need the least amount to reach their goal)
    const getFeaturedCampaigns = () => {
        return campaigns
            .filter(campaign => (campaign.raised || 0) < campaign.goal) // Only incomplete campaigns
            .sort((a, b) => {
                const remainingA = a.goal - (a.raised || 0);
                const remainingB = b.goal - (b.raised || 0);
                return remainingA - remainingB; // Sort by least remaining amount
            })
            .slice(0, 3); // Take top 3
    };

    // Fetch campaigns from database
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                setLoading(true);
                const response = await donationService.getCampaigns();

                if (response.success) {
                    // Process campaigns to handle the schema differences - same as user side
                    const processedCampaigns = (response.data || []).map((campaign: any) => {
                        // Handle raised amount - prioritize 'raised' over 'raisedAmount'
                        const raisedAmount = campaign.raised || campaign.raisedAmount || 0;
                        
                        // Handle donors count with multiple fallbacks - same logic as user side
                        let donorCount = 0;
                        if (Array.isArray(campaign.donors)) {
                            donorCount = campaign.donors.length;
                        } else if (typeof campaign.donors === 'number') {
                            donorCount = campaign.donors;
                        } else if (campaign.donorCount) {
                            donorCount = campaign.donorCount;
                        } else if (campaign.donorsCount) {
                            donorCount = campaign.donorsCount;
                        } else if (campaign.numberOfDonors) {
                            donorCount = campaign.numberOfDonors;
                        } else if (campaign.donations && Array.isArray(campaign.donations)) {
                            donorCount = campaign.donations.length;
                        }

                        return {
                            ...campaign,
                            raised: raisedAmount,
                            donors: donorCount
                        };
                    });
                    
                    setCampaigns(processedCampaigns);
                    setError(null);
                } else {
                    setError(response.message || "Failed to fetch campaigns");
                    toastHook({
                        title: "Error",
                        description: response.message || "Failed to fetch campaigns",
                        variant: "destructive",
                    });
                }
            } catch (err: any) {
                const apiError = handleApiError(err);
                setError(apiError.message || "An error occurred while fetching campaigns");
                toastHook({
                    title: "Error",
                    description: apiError.message || "Failed to load campaigns",
                    variant: "destructive",
                });
                console.error("Admin - Error fetching campaigns:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, [toastHook]);

    // Fetch donation stats and recent donors
    useEffect(() => {
        const fetchStatsAndDonors = async () => {
            try {
                setLoadingStats(true);
                
                // Fetch donation stats
                const statsResponse = await donationService.getDonationStats();
                if (statsResponse.success) {
                    setDonationStats(statsResponse.data);
                } else {
                    console.error("Failed to fetch donation stats:", statsResponse.message);
                }
                
                // Fetch recent donors
                const donorsResponse = await donationService.getRecentDonors();
                if (donorsResponse.success) {
                    // Take only the first 5 recent donors
                    setRecentDonors((donorsResponse.data || []).slice(0, 5));
                } else {
                    console.error("Failed to fetch recent donors:", donorsResponse.message);
                }
            } catch (error: any) {
                console.error("Error fetching stats and donors:", error);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStatsAndDonors();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", { 
            style: "currency", 
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-green-500/15 text-green-600 border-green-200/50">✓ Completed</Badge>;
            case "pending":
                return <Badge className="bg-amber-500/15 text-amber-600 border-amber-200/50">⚠ Pending</Badge>;
            case "failed":
                return <Badge className="bg-red-500/15 text-red-600 border-red-200/50">✕ Failed</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    // Function to calculate progress percentage
    const getProgressPercentage = (raised: number = 0, goal: number) => {
        return Math.min(Math.round((raised / goal) * 100), 100);
    };

    // Function to format date
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return "N/A";
        }
    };

    // Updated function to safely get donor count - matching user side logic
    const getDonorCount = (campaign: Campaign): number => {
        // Handle different possible field names and formats - same as user side
        if (Array.isArray(campaign.donors)) {
            return campaign.donors.length;
        } else if (typeof campaign.donors === 'number') {
            return campaign.donors;
        } else if (typeof campaign.donorCount === 'number') {
            return campaign.donorCount;
        } else if (typeof campaign.donorsCount === 'number') {
            return campaign.donorsCount;
        } else if (typeof campaign.numberOfDonors === 'number') {
            return campaign.numberOfDonors;
        } else if (campaign.donations && Array.isArray(campaign.donations)) {
            return campaign.donations.length;
        } else if (typeof campaign.donors === 'string') {
            // Try to parse if it's a string number
            const parsed = parseInt(campaign.donors, 10);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    const handleInputChange = (field: keyof CreateCampaignForm, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<CreateCampaignForm> = {};
        
        if (!formData.name.trim()) {
            errors.name = "Campaign name is required";
        }
        
        if (!formData.description.trim()) {
            errors.description = "Description is required";
        }
        
        if (!formData.goal || parseFloat(formData.goal) <= 0) {
            errors.goal = "Please enter a valid goal amount";
        }

        if (!formData.endDate) {
            errors.endDate = "End date is required";
        } else {
            const selectedDate = new Date(formData.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate <= today) {
                errors.endDate = "End date must be in the future";
            }
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setIsCreating(true);
            
            const campaignData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                goal: parseFloat(formData.goal),
                endDate: formData.endDate,
                category: formData.category.trim() || undefined
            };

            const response = await donationService.createCampaign(campaignData);
            
            if (response.success) {
                toastHook({
                    title: "Campaign created",
                    description: "Campaign has been successfully created",
                    variant: "success",
                });
                
                // Reset form and close dialog
                setFormData({
                    name: "",
                    description: "",
                    goal: "",
                    endDate: "",
                    category: ""
                });
                setFormErrors({});
                setIsCreateDialogOpen(false);
                
                // Refresh campaigns list
                window.location.reload();
            } else {
                toastHook({
                    title: "Error",
                    description: `Failed to create campaign: ${response.message}`,
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            const errorInfo = handleApiError(err);
            toastHook({
                title: "Error",
                description: `Failed to create campaign: ${errorInfo.message}`,
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const fetchCampaignDonors = async (campaignId: string, campaignName: string) => {
        try {
            // Reset state first
            setSelectedCampaignDonors([]);
            setLoadingDonors(true);
            setSelectedCampaignName(campaignName);
            setIsDonorsDialogOpen(true);
            
            const response = await donationService.getCampaignDonors(campaignId);
            
            console.log("Full Response:", response); // Debug log
            console.log("Response.data:", response?.data); // Debug log
            console.log("Response.success:", response?.success); // Debug log
            
            // Handle the response - check multiple possible formats
            const responseData = response?.data || response;
            const isSuccess = response?.success ?? (responseData && Array.isArray(responseData));
            
            if (isSuccess && Array.isArray(responseData)) {
                if (responseData.length > 0) {
                    // Transform the donor data - data is now flattened
                    const transformedDonors = responseData.map((donor: any) => ({
                        _id: donor._id || '',
                        name: donor.name || 'Anonymous',
                        email: donor.email || 'No email',
                        amount: Number(donor.amount) || 0,
                        date: donor.donatedAt || new Date().toISOString(),
                        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(donor.name || 'Anonymous')}`
                    }));
                    
                    console.log("Transformed Donors:", transformedDonors); // Debug log
                    setSelectedCampaignDonors(transformedDonors);
                } else {
                    setSelectedCampaignDonors([]);
                }
            } else {
                console.error("Unexpected response format:", response);
                toastHook({
                    title: "Error",
                    description: "Unexpected response format from server",
                    variant: "destructive",
                });
                setSelectedCampaignDonors([]);
            }
        } catch (err: any) {
            const apiError = handleApiError(err);
            toastHook({
                title: "Error",
                description: apiError.message || "Failed to load donors",
                variant: "destructive",
            });
            setSelectedCampaignDonors([]);
            console.error("Error fetching campaign donors:", err);
        } finally {
            setLoadingDonors(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            goal: "",
            endDate: "",
            category: ""
        });
        setFormErrors({});
    };

    if (loading) {
        return (
            <div className="space-y-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-start animate-fade-in">
                    <div>
                        <Skeleton className="h-9 w-56 mb-2" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                </div>

                {/* Campaigns Cards Skeleton */}
                <div>
                    <Skeleton className="h-7 w-48 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-64 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Recent Donations Skeleton */}
                <Skeleton className="h-96 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Custom Scrollbar Styles */}
            <style>{`
                /* Webkit Scrollbars */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: hsl(var(--muted) / 0.3);
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--primary) / 0.5);
                    border-radius: 10px;
                    transition: background 0.2s ease;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--primary) / 0.7);
                }

                .custom-scrollbar::-webkit-scrollbar-corner {
                    background: hsl(var(--muted) / 0.3);
                }

                /* Firefox Scrollbars */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: hsl(var(--primary) / 0.5) hsl(var(--muted) / 0.3);
                }

                /* Thin Scrollbar Variant */
                .custom-scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }

                .custom-scrollbar-thin::-webkit-scrollbar-track {
                    background: hsl(var(--border) / 0.2);
                    border-radius: 8px;
                }

                .custom-scrollbar-thin::-webkit-scrollbar-thumb {
                    background: hsl(var(--accent-foreground) / 0.4);
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--accent-foreground) / 0.6);
                }

                /* Table Scrollbar */
                .table-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }

                .table-scrollbar::-webkit-scrollbar-track {
                    background: hsl(var(--muted) / 0.2);
                    border-radius: 4px;
                    margin: 0 8px;
                }

                .table-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.4));
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }

                .table-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(90deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.6));
                    box-shadow: 0 0 8px hsl(var(--primary) / 0.3);
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Donation Management</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                        Track fundraising campaigns, donations, and donor engagement.
                    </p>
                </div>
                
                {/* Create Campaign Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            className="gradient-primary text-primary-foreground hover:shadow-purple"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bento-card gradient-surface border-card-border/50" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-foreground">Create New Campaign</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Start a new fundraising campaign for the alumni community.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateCampaign} className="space-y-6 mt-4">
                            {/* Campaign Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                                    Campaign Name *
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Enter campaign name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    className={`border-card-border/50 focus:border-primary ${
                                        formErrors.name ? "border-destructive" : ""
                                    }`}
                                />
                                {formErrors.name && (
                                    <p className="text-sm text-destructive">{formErrors.name}</p>
                                )}
                            </div>

                            {/* Campaign Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                                    Description *
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe your campaign goals and purpose"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    className={`min-h-[100px] border-card-border/50 focus:border-primary resize-none ${
                                        formErrors.description ? "border-destructive" : ""
                                    }`}
                                />
                                {formErrors.description && (
                                    <p className="text-sm text-destructive">{formErrors.description}</p>
                                )}
                            </div>

                            {/* Goal and End Date Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="goal" className="text-sm font-medium text-foreground">
                                        Goal Amount (₹) *
                                    </Label>
                                    <Input
                                        id="goal"
                                        type="number"
                                        placeholder="100000"
                                        value={formData.goal}
                                        onChange={(e) => handleInputChange("goal", e.target.value)}
                                        className={`border-card-border/50 focus:border-primary ${
                                            formErrors.goal ? "border-destructive" : ""
                                        }`}
                                    />
                                    {formErrors.goal && (
                                        <p className="text-sm text-destructive">{formErrors.goal}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endDate" className="text-sm font-medium text-foreground">
                                        End Date *
                                    </Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                                        className={`border-card-border/50 focus:border-primary ${
                                            formErrors.endDate ? "border-destructive" : ""
                                        }`}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    {formErrors.endDate && (
                                        <p className="text-sm text-destructive">{formErrors.endDate}</p>
                                    )}
                                </div>
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium text-foreground">
                                    Category (Optional)
                                </Label>
                                <Input
                                    id="category"
                                    placeholder="e.g., Scholarship, Infrastructure, Research"
                                    value={formData.category}
                                    onChange={(e) => handleInputChange("category", e.target.value)}
                                    className="border-card-border/50 focus:border-primary"
                                />
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        resetForm();
                                        setIsCreateDialogOpen(false);
                                    }}
                                    disabled={isCreating}
                                    className="border-card-border/50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isCreating}
                                    className="gradient-primary text-primary-foreground hover:shadow-purple"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Campaign
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-slide-up">
                <div className="stats-card-pink">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stats-card-label">Total Raised</p>
                            <p className="stats-card-number">
                                {loadingStats ? "Loading..." : formatCurrency(donationStats?.totalRaised || 0)}
                            </p>
                            <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                                <ArrowUpRight className="w-3 h-3" />
                                This year
                            </p>
                        </div>
                        <IndianRupee className="stats-card-icon" />
                    </div>
                </div>

                <div className="stats-card-blue">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stats-card-label">Active Donors</p>
                            <p className="stats-card-number">
                                {loadingStats ? "Loading..." : (donationStats?.activeDonors || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3 h-3" />
                                Unique contributors
                            </p>
                        </div>
                        <Users className="stats-card-icon" />
                    </div>
                </div>

                <div className="stats-card-orange">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stats-card-label">Avg. Donation</p>
                            <p className="stats-card-number">
                                {loadingStats ? "Loading..." : formatCurrency(donationStats?.avgDonation || 0)}
                            </p>
                            <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3 h-3" />
                                Per donor
                            </p>
                        </div>
                        <TrendingUp className="stats-card-icon" />
                    </div>
                </div>

                <div className="stats-card-teal">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stats-card-label">Campaign Goal</p>
                            <p className="stats-card-number">
                                {loadingStats ? "Loading..." : `${(donationStats?.campaignGoalPercentage || 0).toFixed(0)}%`}
                            </p>
                            <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                                <Target className="w-3 h-3" />
                                Of {loadingStats ? "..." : formatCurrency(donationStats?.totalGoal || 0)} target
                            </p>
                        </div>
                        <Target className="stats-card-icon" />
                    </div>
                </div>
            </div>

            {/* Pagination Controls Component */}
            {(() => {
                const PaginationControls = ({ 
                    currentPage, 
                    totalPages, 
                    onPrevious, 
                    onNext 
                }: { 
                    currentPage: number; 
                    totalPages: number; 
                    onPrevious: () => void; 
                    onNext: () => void; 
                }) => (
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <Button variant="outline" size="sm" onClick={onPrevious} disabled={currentPage === 0} className="gap-1">
                            <ChevronLeft className="h-4 w-4" />Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={onNext} disabled={currentPage >= totalPages - 1} className="gap-1">
                            Next<ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                );

                // Categorize campaigns
                const activeCampaigns = campaigns.filter(c => getProgressPercentage(c.raised, c.goal) < 100);
                const completedCampaigns = campaigns.filter(c => getProgressPercentage(c.raised, c.goal) >= 100);
                const activeTotalPages = Math.ceil(activeCampaigns.length / ITEMS_PER_PAGE);
                const completedTotalPages = Math.ceil(completedCampaigns.length / ITEMS_PER_PAGE);
                const paginatedActive = activeCampaigns.slice(activePage * ITEMS_PER_PAGE, (activePage + 1) * ITEMS_PER_PAGE);
                const paginatedCompleted = completedCampaigns.slice(completedPage * ITEMS_PER_PAGE, (completedPage + 1) * ITEMS_PER_PAGE);

                const CampaignCard = ({ campaign, index }: { campaign: Campaign; index: number }) => {
                    return (
                        <Card key={`campaign-${campaign._id}`} className="overflow-hidden border-border/30 bg-card flex flex-col h-full animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <CardHeader className="pb-3 pt-5 px-5">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
                                            {campaign.name}
                                        </CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Campaign
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Campaign
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col px-5 pb-5 space-y-3">
                                <CardDescription className="line-clamp-2 text-xs">
                                    {campaign.description}
                                </CardDescription>

                                {/* Progress Section */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium text-foreground">{getProgressPercentage(campaign.raised, campaign.goal)}%</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500" style={{ width: `${getProgressPercentage(campaign.raised, campaign.goal)}%` }} />
                                    </div>
                                </div>

                                {/* Raised & Goal */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Raised</p>
                                        <p className="font-semibold text-foreground">{formatCurrency(campaign.raised || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Goal</p>
                                        <p className="font-semibold text-foreground">{formatCurrency(campaign.goal)}</p>
                                    </div>
                                </div>

                                {/* Donors and Button */}
                                <div className="mt-auto pt-2 space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="font-medium text-foreground">{getDonorCount(campaign)} donors</span>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full border-card-border/50 hover:bg-accent h-8 text-xs" onClick={() => fetchCampaignDonors(campaign._id, campaign.name)}>
                                        View Donors
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                };

                return (
                    <>
                        {/* Active Campaigns */}
                        <div>
                            <div className="flex items-center gap-2 mb-4"><Target className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold text-foreground">Active Donations ({activeCampaigns.length})</h2></div>
                            {activeCampaigns.length === 0 ? (
                                <Card className="border-card-border/50"><CardContent className="pt-12 pb-12 text-center"><Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No active campaigns.</p></CardContent></Card>
                            ) : (
                                <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{paginatedActive.map((c, i) => <CampaignCard key={c._id} campaign={c} index={i} />)}</div>{activeTotalPages > 1 && <PaginationControls currentPage={activePage} totalPages={activeTotalPages} onPrevious={() => setActivePage(p => Math.max(0, p - 1))} onNext={() => setActivePage(p => Math.min(activeTotalPages - 1, p + 1))} />}</>
                            )}
                        </div>

                        {/* Completed Campaigns */}
                        <div>
                            <div className="flex items-center gap-2 mb-4"><CheckCircle className="h-5 w-5 text-emerald-500" /><h2 className="text-xl font-semibold text-foreground">Completed Donations ({completedCampaigns.length})</h2></div>
                            {completedCampaigns.length === 0 ? (
                                <Card className="border-card-border/50"><CardContent className="pt-12 pb-12 text-center"><CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No completed campaigns yet.</p></CardContent></Card>
                            ) : (
                                <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{paginatedCompleted.map((c, i) => <CampaignCard key={c._id} campaign={c} index={i} />)}</div>{completedTotalPages > 1 && <PaginationControls currentPage={completedPage} totalPages={completedTotalPages} onPrevious={() => setCompletedPage(p => Math.max(0, p - 1))} onNext={() => setCompletedPage(p => Math.min(completedTotalPages - 1, p + 1))} />}</>
                            )}
                        </div>
                    </>
                );
            })()}

            {/* Recent Donations - Full Width */}
            <Card className="bento-card gradient-surface border-card-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Donations
                    </CardTitle>
                    <CardDescription>
                        Latest donation activity across all campaigns
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingStats ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : recentDonors.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-2">No recent donations</p>
                                <p className="text-sm text-muted-foreground">Donations will appear here once received.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto table-scrollbar">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Donor</TableHead>
                                        <TableHead>Campaign</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentDonors.map((donation, index) => (
                                        <TableRow 
                                            key={`recent-donation-${donation._id}-${index}`}
                                            className="animate-fade-in hover:bg-accent/30"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage 
                                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(donation.name || 'Anonymous')}`} 
                                                            alt={donation.name} 
                                                        />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                            {donation.name.split(' ').map((n: string) => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{donation.name}</p>
                                                        <p className="text-sm text-muted-foreground">{donation.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{donation.campaign}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {donation.graduationYear ? `Class of ${donation.graduationYear}` : 'Alumni'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-semibold text-primary">
                                                    {formatCurrency(donation.amount)}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{formatDate(donation.donatedAt)}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={donation.status === 'completed' ? 'default' : 'secondary'}
                                                    className={
                                                        donation.status === 'completed' 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    }
                                                >
                                                    {donation.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Campaign Donors Dialog */}
            <Dialog open={isDonorsDialogOpen} onOpenChange={setIsDonorsDialogOpen}>
                <DialogContent 
                    key={selectedCampaignDonors.length} // Add this to force re-render
                    className="sm:max-w-[700px] max-w-[95vw] bento-card gradient-surface border-card-border/50" 
                    style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                >
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Campaign Donors
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {selectedCampaignName}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                        {loadingDonors ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                                    <p className="text-muted-foreground">Loading donors...</p>
                                </div>
                            </div>
                        ) : selectedCampaignDonors.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">No donors yet</p>
                                    <p className="text-sm text-muted-foreground">This campaign hasn't received any donations.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedCampaignDonors.map((donor, index) => (
                                        <div
                                            key={`donor-${donor._id}-${index}`}
                                            className="flex items-center justify-between p-4 rounded-lg border border-card-border/50 hover:bg-accent/30 transition-smooth"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarImage 
                                                        src={donor.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${donor.name}`} 
                                                        alt={donor.name} 
                                                    />
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {donor.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{donor.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{donor.email}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(donor.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-lg text-primary">
                                                    {formatCurrency(donor.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-4 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDonorsDialogOpen(false)}
                                        className="border-card-border/50"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
