import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { jobService } from "@/services/ApiServices";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PostJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PostJobDialog({ open, onOpenChange, onSuccess }: PostJobDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    salary: "",
  });
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const jobData = {
        title: formData.title,
        description: formData.description,
        company: formData.company || undefined,
        location: formData.location || undefined,
        salary: formData.salary ? Number(formData.salary) : undefined,
        requirements: requirements.length > 0 ? requirements : undefined,
      };

      const response = await jobService.addJob(jobData as any);

      if (response.success) {
        toast.success("Job posted successfully!");
        resetForm();
        onSuccess?.();
      } else {
        toast.error(response.message || "Failed to post job");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      setRequirements([...requirements, currentRequirement.trim()]);
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      company: "",
      location: "",
      salary: "",
    });
    setRequirements([]);
    setCurrentRequirement("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Job</DialogTitle>
          <DialogDescription>
            Share job opportunities with the alumni network. Your post will be verified by admins.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Senior Software Engineer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              placeholder="e.g., Tech Corp Inc."
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Annual Salary ($)</Label>
              <Input
                id="salary"
                type="number"
                placeholder="e.g., 120000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, responsibilities, and qualifications..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <div className="flex gap-2">
              <Input
                id="requirements"
                placeholder="Add a requirement and press Enter"
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
              />
              <Button type="button" onClick={addRequirement} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {requirements.map((req, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}