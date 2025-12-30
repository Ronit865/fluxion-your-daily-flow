import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { donationService } from '@/services/ApiServices';
import { toast } from 'sonner';
import { Heart, Target, TrendingUp, Loader2 } from 'lucide-react';

interface DonationCampaign {
  _id: string;
  name: string;
  description: string;
  goal: number;
  raisedAmount: number;
  donors: any[];
  createdAt: string;
}

export default function Donations() {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [contributeDialogOpen, setContributeDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await donationService.getCampaigns();
      
      if (response.success) {
        setCampaigns(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch donation campaigns');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load donation campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleContribute = (campaign: DonationCampaign) => {
    setSelectedCampaign(campaign);
    setContributeDialogOpen(true);
    setContributionAmount('');
  };

  const submitContribution = async () => {
    if (!selectedCampaign || !contributionAmount) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setContributing(true);
      const response = await donationService.contributeToCampaign(selectedCampaign._id, amount);
      
      if (response.success) {
        toast.success(`Successfully contributed ₹${amount}!`);
        setContributeDialogOpen(false);
        setContributionAmount('');
        fetchCampaigns();
      } else {
        toast.error(response.message || 'Failed to contribute');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process contribution');
    } finally {
      setContributing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Donation Campaigns</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Support causes that matter to our community</p>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Active Campaigns</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center">Check back later for new donation opportunities</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const progress = ((campaign.raisedAmount ?? 0) / (campaign.goal ?? 1)) * 100;
            const remaining = (campaign.goal ?? 0) - (campaign.raisedAmount ?? 0);
            
            return (
              <Card key={campaign._id} className="bento-card hover:shadow-md border-card-border/50 hover-lift flex flex-col h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg min-h-[3.5rem]">
                    <Heart key="icon" className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span key="name" className="line-clamp-2">{campaign.name}</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col space-y-4">
                  {/* Progress Section */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-primary">₹{(campaign.raisedAmount ?? 0).toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">
                        of ₹{(campaign.goal ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {progress.toFixed(1)}% funded
                    </p>
                  </div>

                  {/* Stats Section */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-card-border/20 flex-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-sm font-semibold">₹{remaining.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Contributors</p>
                        <p className="text-sm font-semibold">{campaign.donors?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Button - Always at bottom */}
                  <div className="pt-2 mt-auto">
                    <Button 
                      className="w-full" 
                      onClick={() => handleContribute(campaign)}
                      disabled={progress >= 100}
                    >
                      {progress >= 100 ? 'Goal Reached' : 'Contribute Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contribution Dialog */}
      <Dialog open={contributeDialogOpen} onOpenChange={setContributeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contribute to {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              Every contribution makes a difference. Thank you for your support!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Contribution Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>

            {selectedCampaign && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Campaign Goal:</span>
                  <span className="font-semibold">₹{(selectedCampaign.goal ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount Raised:</span>
                  <span className="font-semibold">₹{(selectedCampaign.raisedAmount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining:</span>
                  <span className="font-semibold text-orange-600">
                    ₹{((selectedCampaign.goal ?? 0) - (selectedCampaign.raisedAmount ?? 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setContributeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitContribution} disabled={contributing}>
              {contributing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Contribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}