import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCw,
  Download,
  Phone,
  Eye,
  Edit2,
  Users,
  FileText,
  MapPin,
} from "lucide-react";
import {
  useGetMobilizerListQuery,
  useGetMobiliserCandidateListQuery,
  useUpdateCandidateStatusMutation,
} from "@/store/slices/apiSlice";

const candidateStatuses = [
  "Ready for Migration",
  "Not Interested",
  "Need More Counselling",
  "Need Parent Counselling",
  "Health Issue",
  "Not Now but in Near Future",
  "Documents Pending",
  "Verification Failed",
  "MOBILISED",
  "ENROLLED",
  "IN_TRAINING",
  "TRAINED",
  "PLACED",
  "DROPPED ",
];

export default function OFRManagement() {
  // State management
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pulledCandidates, setPulledCandidates] = useState([]);
  const [showCandidatesDialog, setShowCandidatesDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [counsellingNotes, setCounsellingNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [currentMobilizer, setCurrentMobilizer] = useState(null);
  const { toast } = useToast();

  // API hooks
  const {
    data: mobilizerData,
    isLoading: mobilizerLoading,
    error: mobilizerError,
    refetch: refetchMobilizers,
  } = useGetMobilizerListQuery();

  const [updateCandidateStatus, { isLoading: isUpdating }] =
    useUpdateCandidateStatusMutation();
  const [selectedMobilizerId, setSelectedMobilizerId] = useState(null);

  const {
    data: candidateData,
    isLoading: candidateLoading,
    error: candidateError,
  } = useGetMobiliserCandidateListQuery(selectedMobilizerId, {
    skip: !selectedMobilizerId,
  });

  // Derived data
  const districts = mobilizerData?.data
    ? [
        ...new Set(
          mobilizerData.data.map((m) => m.area_location).filter(Boolean)
        ),
      ]
    : [];

  const filteredMobilizers =
    mobilizerData?.data?.filter((mobilizer) => {
      const matchesDistrict =
        !selectedDistrict || mobilizer.area_location === selectedDistrict;
      const matchesSearch =
        !searchTerm ||
        mobilizer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mobilizer.role.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDistrict && matchesSearch;
    }) || [];
  console.log(filteredMobilizers, "filteredMobilizers");

  // Process candidate data from API
  useEffect(() => {
    if (candidateData?.data && currentMobilizer) {
      const candidates = candidateData.data.map((candidate) => ({
        id: candidate.id,
        name: `${candidate.salutation || ""} ${candidate.first_name} ${
          candidate.middle_name || ""
        } ${candidate.last_name || ""}`.trim(),
        fatherName:
          `${candidate.father_first_name || ""} ${
            candidate.father_last_name || ""
          }`.trim() || "N/A",
        mobile: candidate.mobile1,
        district: candidate.district || "N/A",
        status: candidate.status || "Pending Verification",
        counsellingNotes: candidate.notes || "",
        email: candidate.primary_email || "N/A",
        bloodGroup: candidate.blood_group || "N/A",
        motherTongue: candidate.mother_tongue || "N/A",
        religion: candidate.religion || "N/A",
        community: candidate.community || "N/A",
        motherName: candidate.mother_name || "N/A",
        guardiansName: candidate.guardian_name || "N/A",
        maritalStatus: candidate.marital_status || "N/A",
        spouseName: candidate.spouse_name || "N/A",
        annualIncome: candidate.annual_family_income
          ? `₹${parseInt(candidate.annual_family_income).toLocaleString()}`
          : "N/A",
        address: candidate.address_line || "N/A",
        mobilizer: candidate.mobilizer_name,
        project: candidate.project || "N/A",
        centerCode: candidate.center_code || "N/A",
      }));

      setPulledCandidates(candidates);
      toast({
        title: "OFRs Pulled Successfully",
        description: `Pulled ${candidates.length} candidate OFRs from ${currentMobilizer.name}`,
      });
    }

    if (candidateError) {
      toast({
        title: "Error",
        description: "Failed to fetch candidates. Please try again.",
        variant: "destructive",
      });
      setShowCandidatesDialog(false);
    }
  }, [candidateData, candidateError, currentMobilizer, toast]);

  // Handler functions
  const handlePullOFRs = (mobilizer) => {
    setCurrentMobilizer(mobilizer);
    setSelectedMobilizerId(mobilizer.id);
    setShowCandidatesDialog(true);
  };

  const handleReset = () => {
    setSelectedDistrict("");
    setSearchTerm("");
    setSelectedMobilizerId(null);
    setPulledCandidates([]);
  };

  const handleCallCandidate = (candidate) => {
    toast({
      title: "Calling Candidate",
      description: `Initiating call to ${candidate.name} (${candidate.mobile})`,
    });
  };

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setNewStatus(candidate.status);
    setCounsellingNotes(candidate.counsellingNotes || "");
    setShowDetailsDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast({
        title: "Status Required",
        description: "Please select a status before updating.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCandidate?.id || isNaN(parseInt(selectedCandidate.id))) {
      toast({
        title: "Invalid Candidate",
        description: "Selected candidate ID is invalid.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        id: parseInt(selectedCandidate.id),
        status: newStatus,
        notes: counsellingNotes || "", // Ensure notes is a string, even if empty
      };

      console.log("Updating candidate status with payload:", payload); // Debug log

      const response = await updateCandidateStatus(payload).unwrap();

      // Update local state to reflect changes
      const updatedPulledCandidates = pulledCandidates.map((c) =>
        c.id === selectedCandidate.id
          ? { ...c, status: newStatus, counsellingNotes }
          : c
      );
      setPulledCandidates(updatedPulledCandidates);

      toast({
        title: "Status Updated Successfully",
        description: `${selectedCandidate.name}'s status updated to "${newStatus}"`,
      });

      setShowDetailsDialog(false);
      setCounsellingNotes("");
      setNewStatus("");
    } catch (error) {
      console.error("Update error:", {
        status: error.status,
        data: error.data,
        message: error.data?.message,
        error: error.error,
      });
      toast({
        title: "Update Failed",
        description:
          error.data?.message ||
          error.error ||
          "Failed to update candidate status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      "Ready for Migration": "bg-green-100 text-green-800",
      "Not Interested": "bg-red-100 text-red-800",
      "Need More Counselling": "bg-yellow-100 text-yellow-800",
      "Need Parent Counselling": "bg-orange-100 text-orange-800",
      "Health Issue": "bg-purple-100 text-purple-800",
      "Not Now but in Near Future": "bg-blue-100 text-blue-800",
      MOBILISED: "bg-blue-200 text-blue-900",
      ENROLLED: "bg-green-200 text-green-900",
      IN_TRAINING: "bg-amber-200 text-amber-900",
      TRAINED: "bg-emerald-200 text-emerald-900",
      PLACED: "bg-green-300 text-green-900",
      DROPPED: "bg-red-200 text-red-900",
      "Documents Pending": "bg-yellow-200 text-yellow-900",
      "Verification Failed": "bg-red-300 text-red-900",
      default: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || statusColors.default;
  };

  return (
    <MainLayout role="counsellor">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">OFR Management</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Pull and process candidate OFRs from mobilizers
          </div>
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filter OFRs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Search Mobilizer</Label>
                <Input
                  id="search"
                  placeholder="Search by name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobilizers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available OFRs by Mobilizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mobilizerLoading ? (
              <p>Loading mobilizers...</p>
            ) : mobilizerError ? (
              <p>Error loading mobilizers. Please try again.</p>
            ) : (
              <div className="space-y-4">
                {filteredMobilizers.length > 0 ? (
                  filteredMobilizers.map((mobilizer) => (
                    <div
                      key={mobilizer.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{mobilizer.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Badge variant="outline">{mobilizer.role}</Badge>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {mobilizer.area_location || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {mobilizer.ofrCount || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            OFRs Available
                          </div>
                        </div>
                        <Button
                          onClick={() => handlePullOFRs(mobilizer)}
                          disabled={candidateLoading}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Pull OFRs
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4">No mobilizers found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidates Dialog */}
        <Dialog
          open={showCandidatesDialog}
          onOpenChange={setShowCandidatesDialog}
        >
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pulled Candidate OFRs</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {candidateLoading ? (
                <p className="text-center py-4">Loading candidates...</p>
              ) : (
                <>
                  {pulledCandidates.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Father's Name</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>District</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pulledCandidates.map((candidate) => (
                          <TableRow key={candidate.id}>
                            <TableCell className="font-medium">
                              {candidate.name}
                            </TableCell>
                            <TableCell>{candidate.fatherName}</TableCell>
                            <TableCell>{candidate.mobile}</TableCell>
                            <TableCell>{candidate.district}</TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(candidate.status)}
                              >
                                {candidate.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCallCandidate(candidate)}
                                >
                                  <Phone className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(candidate)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-4">No candidates found</p>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Candidate Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Candidate Details & Verification</DialogTitle>
            </DialogHeader>
            {selectedCandidate && (
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-sm">{selectedCandidate.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Project</Label>
                      <p className="text-sm">{selectedCandidate.project}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Center Code</Label>
                      <p className="text-sm">{selectedCandidate.centerCode}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Mobile</Label>
                      <p className="text-sm">{selectedCandidate.mobile}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedCandidate.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Father's Name
                      </Label>
                      <p className="text-sm">{selectedCandidate.fatherName}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Blood Group</Label>
                      <p className="text-sm">{selectedCandidate.bloodGroup}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Mother Tongue
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.motherTongue}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Religion</Label>
                      <p className="text-sm">{selectedCandidate.religion}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Community</Label>
                      <p className="text-sm">{selectedCandidate.community}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Family Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Family Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Mother's Name
                      </Label>
                      <p className="text-sm">{selectedCandidate.motherName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Guardian's Name
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.guardiansName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Marital Status
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.maritalStatus}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Annual Income
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.annualIncome}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedCandidate.address}</p>
                  </CardContent>
                </Card>

                {/* Counselling Notes & Status Update */}
                <Card>
                  <CardHeader>
                    <CardTitle>Counselling & Status Update</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="notes">Counselling Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Enter counselling notes and observations..."
                        value={counsellingNotes}
                        onChange={(e) => setCounsellingNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Update Status</Label>
                      <Select
                        value={newStatus}
                        onValueChange={setNewStatus}
                        disabled={isUpdating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidateStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleUpdateStatus}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Update Status
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCallCandidate(selectedCandidate)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Candidate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
