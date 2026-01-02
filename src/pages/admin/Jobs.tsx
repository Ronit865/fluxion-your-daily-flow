import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { jobService } from '@/services/ApiServices';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, MapPin, DollarSign, Check, Trash2, Clock, AlertCircle, CheckCircle, Calendar, Users, Loader2, Mail, GraduationCap } from 'lucide-react';

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

interface Applicant {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  course?: string;
  graduationYear?: string;
  appliedAt?: string;
}

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Applicants Dialog State
  const [isApplicantsDialogOpen, setIsApplicantsDialogOpen] = useState(false);
  const [selectedJobApplicants, setSelectedJobApplicants] = useState<Applicant[]>([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [loadingApplicants, setLoadingApplicants] = useState(false);

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
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 bg-muted/60" />
            <Skeleton className="h-4 w-80 bg-muted/60" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className="rounded-2xl p-4 sm:p-5 bg-card/50 border border-border/50"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20 bg-muted/60" />
                  <Skeleton className="h-8 w-16 bg-muted/60" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl bg-muted/60" />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms' }}>
          <Skeleton className="h-10 w-full rounded-lg bg-muted/60" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="rounded-2xl p-5 bg-card/50 border border-border/50 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${300 + i * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4 bg-muted/60" />
                  <Skeleton className="h-3 w-1/2 bg-muted/60" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-muted/60" />
                <Skeleton className="h-3 w-5/6 bg-muted/60" />
              </div>
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="h-4 w-24 bg-muted/60" />
                <Skeleton className="h-4 w-20 bg-muted/60" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-16 rounded-full bg-muted/60" />
                <Skeleton className="h-8 w-20 rounded-lg bg-muted/60" />
              </div>
            </div>
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
                  onVerify={undefined}
                  onViewApplicants={(jobId, jobTitle, applicants) => {
                    setSelectedJobTitle(jobTitle);
                    setSelectedJobApplicants(applicants || []);
                    setIsApplicantsDialogOpen(true);
                  }}
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

      {/* Applicants Dialog - Redesigned */}
      <Dialog open={isApplicantsDialogOpen} onOpenChange={setIsApplicantsDialogOpen}>
        <DialogContent 
          className="sm:max-w-[700px] max-w-[95vw] bento-card gradient-surface border-card-border/50" 
          style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <DialogHeader className="pb-4 border-b border-card-border/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Job Applicants
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  {selectedJobTitle} • {selectedJobApplicants.length} applicants
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            {loadingApplicants ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-muted-foreground font-medium">Loading applicants...</p>
                </div>
              </div>
            ) : selectedJobApplicants.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No applicants yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">This job hasn't received any applications. Share the listing to get more applicants.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                {selectedJobApplicants.map((applicant, index) => (
                  <div 
                    key={`applicant-${applicant._id || index}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-card-border/30 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 group animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                        <AvatarImage 
                          src={applicant.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${applicant.name || applicant.email}`} 
                          alt={applicant.name || 'Applicant'} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/50 text-primary font-semibold">
                          {(applicant.name || applicant.email || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {applicant.name || 'Anonymous Applicant'}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{applicant.email || 'No email'}</span>
                        </div>
                        {applicant.course && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <GraduationCap className="h-3 w-3" />
                            <span>{applicant.course} {applicant.graduationYear && `• ${applicant.graduationYear}`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      Applied
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-card-border/20">
            <Button
              variant="outline"
              onClick={() => setIsApplicantsDialogOpen(false)}
              className="border-card-border/50"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onVerify?: (id: string) => void;
  onDelete: (id: string) => void;
  onViewApplicants?: (jobId: string, jobTitle: string, applicants: any[]) => void;
  actionLoading: string | null;
}

function JobCard({ job, onVerify, onDelete, onViewApplicants, actionLoading }: JobCardProps) {
  return (
    <Card className="overflow-hidden border-border/30 bg-card flex flex-col h-full group hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {job.title}
          </CardTitle>
          {job.isVerified ? (
            <Badge className="bg-green-500/15 text-green-600 border-green-200/50 text-xs shrink-0">✓ Verified</Badge>
          ) : (
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-200/50 text-xs shrink-0">⚠ Pending</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col px-5 pb-5">
        {/* Company */}
        <p className="text-sm font-medium text-muted-foreground mb-4">
          {job.company || 'Company Not Specified'}
        </p>

        {/* Category */}
        {job.category && (
          <Badge variant="secondary" className="text-xs font-medium w-fit mb-4">
            {job.category}
          </Badge>
        )}

        {/* Job Details - Stacked */}
        <div className="space-y-3 text-sm flex-1 mb-4">
          {job.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">{job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">${job.salary.toLocaleString()}/yr</span>
            </div>
          )}
          {job.jobType && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">{job.jobType}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-foreground font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Applicants */}
        {job.applicants && job.applicants.length > 0 && (
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium">{job.applicants.length} applicant{job.applicants.length !== 1 ? 's' : ''}</span>
            </div>
            {onViewApplicants && (
              <Button
                onClick={() => onViewApplicants(job._id, job.title, job.applicants || [])}
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-primary hover:bg-transparent hover:underline"
              >
                View
              </Button>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-4 flex gap-2">
          {!job.isVerified && onVerify && (
            <Button 
              onClick={() => onVerify(job._id)} 
              disabled={actionLoading === job._id}
              size="sm"
              className="flex-1"
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
        </div>
      </CardContent>
    </Card>
  );
}

export default Jobs;