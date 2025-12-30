import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { jobService } from "@/services/ApiServices";
import PostJobDialog from "@/components/PostJobDialog";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Eye,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Job {
  _id: string;
  title: string;
  description: string;
  location: string;
  company: string;
  jobType: string;
  category: string;
  experienceRequired: string;
  salary: number;
  isVerified: boolean;
  applicants?: any[];
  postedBy?: string;
  createdAt: string;
}

export default function Jobs() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [jobDetailsData, setJobDetailsData] = useState<Job | null>(null);

  // Get current user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    console.log('Current User ID:', userId); // Debug log
    setCurrentUserId(userId);
  }, []);

  const fetchAllJobs = async () => {
    try {
      const response = await jobService.getAllJobs();

      if (response.success) {
        // Ensure data is an array and filter only verified jobs
        const jobsData = Array.isArray(response.data) ? response.data : [];
        console.log('Fetched Jobs:', jobsData); // Debug log
        const verifiedJobs = jobsData.filter((job: Job) => job.isVerified === true);
        setAllJobs(verifiedJobs);
      } else {
        toast.error(response.message || "Failed to fetch jobs");
        setAllJobs([]);
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error(error.message || "Failed to load jobs");
      setAllJobs([]);
    }
  };

  const fetchPostedJobs = async () => {
    try {
      const response = await jobService.getMyPostedJobs();

      if (response.success) {
        // Ensure data is an array
        const jobsData = Array.isArray(response.data) ? response.data : [];
        setPostedJobs(jobsData);
      } else {
        toast.error(response.message || "Failed to fetch posted jobs");
        setPostedJobs([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load posted jobs");
      setPostedJobs([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchAllJobs(), fetchPostedJobs()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (jobId: string) => {
    if (!currentUserId) {
      toast.error("Please log in to apply for jobs");
      return;
    }

    try {
      const response = await jobService.applyForJob(jobId);
      console.log('Apply Response:', response); // Debug log

      if (response.success) {
        toast.success("Application submitted successfully!");
        // Refresh jobs to get updated applicants list
        await fetchAllJobs();
      } else {
        toast.error(response.message || "Failed to apply for job");
      }
    } catch (error: any) {
      console.error('Apply Error:', error);
      // Handle structured error from backend
      const errorMessage = error.message || "Failed to apply for job. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleUnapply = async (jobId: string) => {
    if (!currentUserId) {
      toast.error("Please log in to unapply");
      return;
    }

    try {
      const response = await jobService.unapplyForJob(jobId);
      console.log('Unapply Response:', response); // Debug log

      if (response.success) {
        toast.success("Application withdrawn successfully!");
        // Refresh jobs to get updated applicants list
        await fetchAllJobs();
      } else {
        toast.error(response.message || "Failed to withdraw application");
      }
    } catch (error: any) {
      console.error('Unapply Error:', error);
      const errorMessage = error.message || "Failed to withdraw application. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setEditDialogOpen(true);
  };

  const handleDelete = (jobId: string) => {
    setJobToDelete(jobId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      setDeleting(true);
      const response = await jobService.deleteJob(jobToDelete);

      if (response.success) {
        toast.success("Job deleted successfully");
        fetchPostedJobs();
      } else {
        toast.error(response.message || "Failed to delete job");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete job");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const viewApplicants = async (job: Job) => {
    setSelectedJob(job);
    setApplicantsDialogOpen(true);

    try {
      setLoadingApplicants(true);
      const response = await jobService.getJobApplicants(job._id);

      console.log('Applicants API Response:', response); // Debug log

      if (response.success) {
        // The backend returns job.applicants as response.data directly
        const applicantsData = Array.isArray(response.data) ? response.data : [];
        console.log('Processed Applicants:', applicantsData); // Debug log
        setApplicants(applicantsData);
      } else {
        toast.error(response.message || "Failed to fetch applicants");
        setApplicants([]);
      }
    } catch (error: any) {
      console.error('Error fetching applicants:', error); // Debug log
      toast.error(error.message || "Failed to load applicants");
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const hasApplied = (job: Job) => {
    if (!currentUserId || !job.applicants || !Array.isArray(job.applicants)) {
      console.log('hasApplied check:', { currentUserId, applicants: job.applicants, jobId: job._id });
      return false;
    }
    const applied = job.applicants.some((applicant: any) => {
      const applicantId = typeof applicant === 'string' ? applicant : applicant._id || applicant.id;
      return applicantId === currentUserId;
    });
    console.log('Job:', job.title, 'Applied:', applied, 'Applicants:', job.applicants);
    return applied;
  };

  const handleViewDetails = (job: Job) => {
    setJobDetailsData(job);
    setJobDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Job Opportunities</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse and apply for jobs or manage your postings
          </p>
        </div>
        <Button onClick={() => setPostDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Post a Job
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All Jobs ({allJobs.length})</TabsTrigger>
          <TabsTrigger value="posted" className="text-xs sm:text-sm">My Posted ({postedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {allJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Jobs Available</h3>
                <p className="text-muted-foreground text-center">
                  There are no job postings at the moment. Check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {allJobs.map((job) => (
                <Card key={job._id} className="bento-card hover:shadow-md border-card-border/50 hover-lift flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2 min-h-[3.5rem]">{job.title}</CardTitle>
                      {job.isVerified && (
                        <Badge variant="default" className="flex items-center gap-1 flex-shrink-0">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {job.description}
                    </p>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>₹{job.salary.toLocaleString()}/year</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{job.jobType}</Badge>
                      <Badge variant="outline">{job.experienceRequired}</Badge>
                      <Badge variant="secondary">{job.category}</Badge>
                    </div>

                    <div className="pt-2 mt-auto space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleViewDetails(job)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        className={`w-full ${hasApplied(job) ? 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold shadow-lg' : ''}`}
                        onClick={() => hasApplied(job) ? handleUnapply(job._id) : handleApply(job._id)}
                        variant={hasApplied(job) ? "default" : "default"}
                      >
                        {hasApplied(job) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Applied
                          </>
                        ) : (
                          "Apply Now"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posted" className="mt-6">
          {postedJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Jobs Posted Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't posted any jobs yet. Start by creating your first job posting.
                </p>
                <Button onClick={() => setPostDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {postedJobs.map((job) => (
                <Card key={job._id} className="bento-card hover:shadow-md border-card-border/50 hover-lift flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2 min-h-[3.5rem]">{job.title}</CardTitle>
                      <div className="flex gap-2 flex-shrink-0">
                        {job.isVerified ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {job.description}
                    </p>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>₹{job.salary.toLocaleString()}/year</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>Posted {formatDate(job.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{job.applicants?.length || 0} Applicants</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{job.jobType}</Badge>
                      <Badge variant="outline">{job.experienceRequired}</Badge>
                    </div>

                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => viewApplicants(job)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Applicants
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(job)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(job._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Post Job Dialog */}
      <PostJobDialog
        open={postDialogOpen}
        onOpenChange={setPostDialogOpen}
        onSuccess={fetchPostedJobs}
      />

      {/* Edit Job Dialog */}
      <PostJobDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchPostedJobs}
        jobData={selectedJob ? {
          id: selectedJob._id,
          title: selectedJob.title,
          description: selectedJob.description,
          location: selectedJob.location,
          company: selectedJob.company,
          jobType: selectedJob.jobType,
          category: selectedJob.category,
          experienceRequired: selectedJob.experienceRequired,
          salary: selectedJob.salary,
        } : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting
              and remove all applicant data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Applicants Dialog */}
      <Dialog open={applicantsDialogOpen} onOpenChange={setApplicantsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Applicants</DialogTitle>
            <DialogDescription>
              {selectedJob?.title} - {applicants.length} applicant(s)
            </DialogDescription>
          </DialogHeader>

          {loadingApplicants ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applicants yet
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((applicant, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{applicant.name}</h4>
                        <p className="text-sm text-muted-foreground">{applicant.email}</p>
                        {applicant.resume && (
                          <a
                            href={applicant.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-2 inline-block"
                          >
                            View Resume
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={jobDetailsOpen} onOpenChange={setJobDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{jobDetailsData?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {jobDetailsData?.company}
            </DialogDescription>
          </DialogHeader>

          {jobDetailsData && (
            <div className="space-y-6">
              {/* Status Badge */}
              {jobDetailsData.isVerified && (
                <Badge variant="default" className="flex items-center gap-1 w-fit">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </Badge>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{jobDetailsData.description}</p>
              </div>

              {/* Job Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="font-semibold">{jobDetailsData.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salary</p>
                      <p className="font-semibold">₹{jobDetailsData.salary.toLocaleString()}/year</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Job Type</p>
                      <p className="font-semibold">{jobDetailsData.jobType}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <p className="font-semibold">{jobDetailsData.category}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Experience Required</p>
                      <p className="font-semibold">{jobDetailsData.experienceRequired}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Posted On</p>
                      <p className="font-semibold">{formatDate(jobDetailsData.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className={`flex-1 ${hasApplied(jobDetailsData) ? 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold shadow-lg' : ''}`}
                  onClick={() => {
                    if (hasApplied(jobDetailsData)) {
                      handleUnapply(jobDetailsData._id);
                    } else {
                      handleApply(jobDetailsData._id);
                    }
                    setJobDetailsOpen(false);
                  }}
                >
                  {hasApplied(jobDetailsData) ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Applied - Click to Withdraw
                    </>
                  ) : (
                    "Apply Now"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
