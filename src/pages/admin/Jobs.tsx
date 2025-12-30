import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { jobService } from '@/services/ApiServices';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, MapPin, DollarSign, Check, Trash2, Clock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  salary?: number;
  requirements?: string[];
  isVerified: boolean;
  jobType?: string;
  category?: string;
  experienceRequired?: string;
  applicants?: any[];
  postedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await jobService.getAllJobs();
      
      if (response.success) {
        const jobsData = Array.isArray(response.data) 
          ? response.data 
          : Array.isArray(response.message) 
          ? response.message 
          : [];
        
        setJobs(jobsData);
      } else {
        const errorMsg = response.message || 'Failed to fetch jobs';
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load jobs';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleVerifyJob = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      const response = await jobService.verifyJob(jobId);
      
      if (response.success) {
        toast({
          title: "Job verified",
          description: "Job has been successfully verified",
          variant: "success",
        });
        fetchJobs();
      } else {
        toast({
          title: "Error",
          description: response.message || 'Failed to verify job',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to verify job',
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      setActionLoading(jobToDelete);
      const response = await jobService.rejectJob(jobToDelete);
  
      if (response.data.success) {
        toast({
          title: "Job rejected",
          description: "Job has been successfully rejected",
          variant: "success",
        });
        fetchJobs();
      } else {
        toast({
          title: "Error",
          description: response.data.message || 'Failed to reject job',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to reject job',
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const pendingJobs = jobs.filter(job => !job.isVerified);
  const verifiedJobs = jobs.filter(job => job.isVerified);

  // Calculate stats
  const totalJobs = jobs.length;
  const pendingCount = pendingJobs.length;
  const verifiedCount = verifiedJobs.length;

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start animate-fade-in">
          <div>
            <Skeleton className="h-9 w-56 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>

        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Events Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Job Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Verify and manage job postings from the alumni network.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchJobs} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 animate-slide-up">
        <div className="stats-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Total Jobs</p>
              <p className="stats-card-number">{totalJobs}</p>
            </div>
            <Briefcase className="stats-card-icon" />
          </div>
        </div>
        
        <div className="stats-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Pending</p>
              <p className="stats-card-number">{pendingCount}</p>
            </div>
            <Clock className="stats-card-icon" />
          </div>
        </div>
        
        <div className="stats-card-teal col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Verified</p>
              <p className="stats-card-number">{verifiedCount}</p>
            </div>
            <CheckCircle className="stats-card-icon" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            <Clock className="h-4 w-4 mr-2" />
            Pending Verification
            {pendingJobs.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90">
                {pendingJobs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">
            <CheckCircle className="h-4 w-4 mr-2" />
            Verified Jobs
            {verifiedJobs.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-success/10 text-success hover:bg-success/20">
                {verifiedJobs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Jobs Tab */}
        <TabsContent value="pending" className="mt-6">
          {pendingJobs.length === 0 ? (
            <Card className="border-dashed bento-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">All Caught Up!</h3>
                <p className="text-muted-foreground text-center">No pending jobs to verify</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {pendingJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onVerify={handleVerifyJob}
                  onDelete={(id) => {
                    setJobToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Verified Jobs Tab */}
        <TabsContent value="verified" className="mt-6">
          {verifiedJobs.length === 0 ? (
            <Card className="border-dashed bento-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Briefcase className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">No Verified Jobs</h3>
                <p className="text-muted-foreground text-center">Verified jobs will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {verifiedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onDelete={(id) => {
                    setJobToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bento-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Job Posting?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently reject and delete the job posting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} className="bg-destructive hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onVerify?: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: string | null;
}

function JobCard({ job, onVerify, onDelete, actionLoading }: JobCardProps) {
  return (
    <Card className="bento-card hover-lift border-card-border/50 overflow-hidden flex flex-col h-full">
      <CardHeader className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-1 text-foreground min-h-[1.75rem]">
            {job.title}
          </CardTitle>
          {job.isVerified ? (
            <Badge className="bg-success/10 text-success border-success/20 shrink-0">
              <Check className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="border-warning text-warning shrink-0">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-1 text-base font-medium text-primary min-h-[1.5rem]">
          {job.company || 'Company Not Specified'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {job.description}
        </p>
        
        <div className="space-y-2.5 flex-1">
          {job.location && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <span className="truncate font-medium text-foreground">{job.location}</span>
            </div>
          )}
          
          {job.salary && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <span className="font-medium text-foreground">${job.salary.toLocaleString()} / year</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-medium text-foreground">{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>

          {job.jobType && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Briefcase className="h-4 w-4 text-warning" />
              </div>
              <span className="font-medium text-foreground">{job.jobType}</span>
            </div>
          )}
        </div>

        {job.category && (
          <Badge variant="outline" className="text-xs font-medium">
            {job.category}
          </Badge>
        )}

        {job.requirements && job.requirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Requirements:</p>
            <div className="flex flex-wrap gap-2">
              {job.requirements.slice(0, 2).map((req, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {req}
                </Badge>
              ))}
              {job.requirements.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{job.requirements.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {job.applicants && job.applicants.length > 0 && (
          <div className="pt-3 border-t border-card-border/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {job.applicants.length}
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Applicant{job.applicants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2 pt-4 border-t border-card-border/20 mt-auto">
        {!job.isVerified && onVerify && (
          <Button 
            onClick={() => onVerify(job._id)} 
            disabled={actionLoading === job._id}
            className="flex-1 gradient-primary text-primary-foreground hover:shadow-purple"
            size="sm"
          >
            <Check className="h-4 w-4 mr-2" />
            Verify
          </Button>
        )}
        <Button 
          onClick={() => onDelete(job._id)} 
          disabled={actionLoading === job._id}
          variant="destructive"
          size="sm"
          className="flex-1"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}

export default Jobs;