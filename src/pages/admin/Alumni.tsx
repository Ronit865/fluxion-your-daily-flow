import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/ApiServices";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  MapPin,
  Building,
  Calendar,
  Loader2,
  Upload,
  FileText,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Transform } from "stream";

// Define the User interface based on your backend model
interface User {
  _id: string;
  name: string;
  email: string;
  graduationYear?: string;
  course?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form data interface for editing
interface EditFormData {
  name: string;
  email: string;
  graduationYear: string;
  course: string;
  phone: string;
  role: string;
}

export function Alumni() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Edit dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: "",
    email: "",
    graduationYear: "",
    course: "",
    phone: "",
    role: "",
  });
  
  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const queryClient = useQueryClient();

  // CSV Upload Mutation
  const uploadCSVMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);
      return await adminService.uploadCSV(formData);
    },
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Alumni data uploaded successfully",
      });
      setIsDialogOpen(false);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload CSV file",
        variant: "destructive",
      });
    },
  });

  // Edit User Mutation
  const editUserMutation = useMutation({
    mutationFn: async (data: { userId: string; formData: EditFormData }) => {
      return await adminService.editUserDetails(data.userId, data.formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User details updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user details",
        variant: "destructive",
      });
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await adminService.deleteUser(userId);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Fetch alumni data using React Query
  const {
    data: alumniResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["alumni"],
    queryFn: async () => {
      const response = await adminService.getAllUsers();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch alumni data",
        variant: "destructive",
      });
    }
  }, [error]);

  // Fix: Extract data from the response object
  const alumniData: User[] = Array.isArray(alumniResponse?.data) 
    ? alumniResponse.data 
    : [];

  const filteredAlumni = alumniData.filter((alumni) => {
    if (!alumni || typeof alumni !== "object") {
      return false;
    }

    const matchesSearch =
      alumni.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.course?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "verified" && alumni.isVerified) ||
      (selectedStatus === "pending" && !alumni.isVerified);
    return matchesSearch && matchesStatus;
  });

  // Calculate stats from actual data
   const totalUsers = alumniData.length;
  const alumniCount = alumniData.filter(
    (user) => user?.role?.toLowerCase() === "alumni"
  ).length;
  const studentCount = alumniData.filter(
    (user) => user?.role?.toLowerCase() === "student"
  ).length;

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      graduationYear: user.graduationYear || "",
      course: user.course || "",
      phone: user.phone || "",
      role: user.role || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle form input changes
  const handleEditFormChange = (field: keyof EditFormData, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle edit form submission
  const handleEditSubmit = () => {
    if (!editingUser) return;
    
    editUserMutation.mutate({
      userId: editingUser._id,
      formData: editFormData
    });
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete._id);
  };

  const getStatusBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-warning text-warning">
          Pending
        </Badge>
      );
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-destructive/10 text-destructive border-destructive/20",
      alumni: "bg-primary/10 text-primary border-primary/20",
      student: "bg-success/10 text-success border-success/20",
      faculty: "bg-warning/10 text-warning border-warning/20",
    };

    const colorClass = roleColors[role?.toLowerCase() as keyof typeof roleColors] || "bg-muted/10 text-muted-foreground border-muted/20";

    return (
      <Badge className={colorClass}>
        {role || "User"}
      </Badge>
    );
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv') {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadCSVMutation.mutate(selectedFile);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start animate-fade-in">
          <div>
            <Skeleton className="h-9 w-56 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Table Skeleton */}
        <Skeleton className="h-[600px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Users Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Manage alumni profiles, verify registrations, and track engagement.
          </p>
        </div>
        
        {/* Add Alumni Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:shadow-purple">
              <Plus className="h-4 w-4 mr-2" />
              Add Alumni
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bento-card gradient-surface border-card-border/50" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Alumni CSV
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file containing alumni data. The file should include columns for name, email, graduation year, course, and phone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-card-border/50 hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {selectedFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-foreground font-medium mb-2">
                        Drop your CSV file here, or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV files up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CSV Format Info */}
              <div className="bg-accent/20 border border-accent/30 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Expected CSV Format:</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Your CSV file should include the following columns:
                </p>
                <code className="text-xs bg-background/50 p-2 rounded block">
                  name, email, graduationYear, course, phone
                </code>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={uploadCSVMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadCSVMutation.isPending}
                className="gradient-primary text-primary-foreground"
              >
                {uploadCSVMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg bento-card gradient-surface border-card-border/50" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit User Details
            </DialogTitle>
            <DialogDescription>
              Update the user information below. All fields are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-graduation">Graduation Year</Label>
                <Input
                  id="edit-graduation"
                  value={editFormData.graduationYear}
                  onChange={(e) => handleEditFormChange('graduationYear', e.target.value)}
                  placeholder="e.g. 2023"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-course">Course</Label>
                <Input
                  id="edit-course"
                  value={editFormData.course}
                  onChange={(e) => handleEditFormChange('course', e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => handleEditFormChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editFormData.role} 
                  onValueChange={(value) => handleEditFormChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={editUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editUserMutation.isPending}
              className="gradient-primary text-primary-foreground"
            >
              {editUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for{" "}
              <strong>{userToDelete?.name}</strong> and remove all their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-slide-up">
        <div className="stats-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Alumni</p>
              <p className="stats-card-number">{alumniCount.toLocaleString()}</p>
            </div>
            <UserCheck className="stats-card-icon" />
          </div>
        </div>

        <div className="stats-card-teal">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Students</p>
              <p className="stats-card-number">{studentCount.toLocaleString()}</p>
            </div>
            <UserCheck className="stats-card-icon" />
          </div>
        </div>

        <div className="stats-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Total Users</p>
              <p className="stats-card-number">{totalUsers.toLocaleString()}</p>
            </div>
            <UserX className="stats-card-icon" />
          </div>
        </div>

        <div className="stats-card-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-card-label">Active This Month</p>
              <p className="stats-card-number">{Math.floor(totalUsers * 0.68).toLocaleString()}</p>
            </div>
            <UserCheck className="stats-card-icon" />
          </div>
        </div>
      </div>

      {/* Alumni Table */}
      <Card className="bento-card gradient-surface border-card-border/50">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Alumni Directory</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage and verify alumni profiles ({filteredAlumni.length} of{" "}
                {totalUsers} alumni)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search alumni..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-48 md:w-64"
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none">
                      Status: {selectedStatus === "all" ? "All" : selectedStatus}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover">
                    <DropdownMenuItem onClick={() => setSelectedStatus("all")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("verified")}
                    >
                      Verified
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("pending")}
                    >
                      Pending
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs sm:text-sm">
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Alumni</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">Graduation</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Course</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Role</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlumni.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      No alumni found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlumni.map((alumni, index) => (
                    <TableRow
                      key={alumni._id}
                      className="hover:bg-accent/30 transition-smooth animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarImage src={alumni.avatar} alt={alumni.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                              {alumni.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "UN"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                              {alumni.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                              {alumni.email}
                            </p>
                            {/* Mobile: Show graduation year below name */}
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {alumni.graduationYear || "N/A"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2 sm:p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="font-medium text-xs sm:text-sm">
                            {alumni.graduationYear || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2 sm:p-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="font-medium text-xs sm:text-sm">
                            {alumni.course || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                        <span className="text-xs sm:text-sm">{alumni.phone || "N/A"}</span>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        {getRoleBadge(alumni.role || "")}
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuLabel className="text-xs sm:text-sm">Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditUser(alumni)} className="text-xs sm:text-sm">
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive text-xs sm:text-sm"
                              onClick={() => handleDeleteUser(alumni)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}