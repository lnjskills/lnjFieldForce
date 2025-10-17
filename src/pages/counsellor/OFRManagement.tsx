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
  useGetCandidateDetailsQuery,
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
  } = useGetMobilizerListQuery(undefined);

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

  // Candidate details via RTK Query (uses apiSlice baseUrl + auth headers)
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(
    null
  );

  const {
    data: candidateDetailsData,
    isLoading: candidateDetailsLoading,
    error: candidateDetailsError,
  } = useGetCandidateDetailsQuery(selectedCandidateId, {
    skip: !selectedCandidateId,
  });
  console.log(candidateDetailsData, "candidate details");

  useEffect(() => {
    if (candidateDetailsData) {
      setSelectedCandidate(candidateDetailsData);
      setNewStatus(candidateDetailsData.status || "");
      setCounsellingNotes(candidateDetailsData.notes || "");
    }

    if (candidateDetailsError) {
      toast({
        title: "Error",
        description: "Failed to fetch candidate details. Please try again.",
        variant: "destructive",
      });
      setShowDetailsDialog(false);
    }
  }, [candidateDetailsData, candidateDetailsError, toast]);
  // Derived data
  type Mobilizer = {
    id?: number | string;
    name?: string;
    role?: string;
    state?: string | null;
    ofrCount?: number;
  };

  const mobilizerList: Mobilizer[] = Array.isArray(mobilizerData?.data)
    ? (mobilizerData.data as Mobilizer[])
    : [];

  const districts: string[] = mobilizerList.length
    ? Array.from(
        new Set(
          mobilizerList
            .map((m) => (m.state || "").toString().trim())
            .filter(Boolean)
        )
      )
    : [];

  const filteredMobilizers = mobilizerList.filter((mobilizer) => {
    const matchesDistrict =
      !selectedDistrict || (mobilizer.state || "") === selectedDistrict;
    const matchesSearch =
      !searchTerm ||
      (mobilizer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mobilizer.role || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDistrict && matchesSearch;
  });
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
    if (!candidate?.id) {
      toast({
        title: "Invalid Candidate",
        description: "Candidate ID missing.",
        variant: "destructive",
      });
      return;
    }

    // Trigger RTK Query to fetch candidate details (caching + auth headers handled by apiSlice)
    setSelectedCandidateId(candidate.id);
    // clear any previous selection while the new one is loading
    setSelectedCandidate(null);
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
                              {mobilizer.state || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {mobilizer.ofrCount || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            OFRs Available
                          </div>
                        </div> */}
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
        {/* Candidate Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Candidate Details & Verification</DialogTitle>
            </DialogHeader>
            {candidateDetailsLoading ? (
              <p className="text-center py-6">Loading candidate details...</p>
            ) : candidateDetailsError ? (
              <p className="text-center py-6 text-red-600">
                Failed to load candidate details.
              </p>
            ) : selectedCandidate ? (
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">ID</Label>
                      <p className="text-sm">{selectedCandidate.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-sm font-medium">
                        {`${selectedCandidate.salutation || ""} ${
                          selectedCandidate.first_name || ""
                        } ${selectedCandidate.middle_name || ""} ${
                          selectedCandidate.last_name || ""
                        }`.trim() || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Project</Label>
                      <p className="text-sm">
                        {selectedCandidate.project || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Center Code</Label>
                      <p className="text-sm">
                        {selectedCandidate.center_code || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Mobile 1</Label>
                      <p className="text-sm">
                        {selectedCandidate.mobile1 || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Mobile 2</Label>
                      <p className="text-sm">
                        {selectedCandidate.mobile2 || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Primary Email
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.primary_email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Emergency Contact
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.emergency_contact || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Emergency Relation
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.emergency_relation || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created By</Label>
                      <p className="text-sm">
                        {selectedCandidate.created_by || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Photo URL</Label>
                      <p className="text-sm">
                        {selectedCandidate.photo_url ? (
                          <a
                            href={selectedCandidate.photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline text-xs"
                          >
                            View Photo
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Aadhaar No</Label>
                      <p className="text-sm">
                        {selectedCandidate.aadhar_no || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Bank Account
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.bank_acct || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Region ID</Label>
                      <p className="text-sm">
                        {selectedCandidate.region_id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Pre Training
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.pre_training || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Gender</Label>
                      <p className="text-sm">
                        {selectedCandidate.gender || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Date of Birth
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.dob
                          ? new Date(selectedCandidate.dob).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm">
                        <Badge variant="secondary">
                          {selectedCandidate.category || "N/A"}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Blood Group</Label>
                      <p className="text-sm">
                        {selectedCandidate.blood_group || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Mother Tongue
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.mother_tongue || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Religion</Label>
                      <p className="text-sm">
                        {selectedCandidate.religion || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Community</Label>
                      <p className="text-sm">
                        {selectedCandidate.community || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Special Group
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.special_group || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Special Group Category
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.special_group_category || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">PWD</Label>
                      <p className="text-sm">
                        {selectedCandidate.pwd === "Yes" ? (
                          <Badge variant="destructive">
                            Yes - {selectedCandidate.pwd_category || "N/A"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Family & Guardian Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Family & Guardian Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Father's Name
                      </Label>
                      <p className="text-sm">
                        {`${selectedCandidate.father_first_name || ""} ${
                          selectedCandidate.father_last_name || ""
                        }`.trim() || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Father's Occupation
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.father_occupation || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Mother's Name
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.mother_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Mother's Occupation
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.mother_occupation || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Guardian Type
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.guardian_type || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Guardian Name
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.guardian_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Marital Status
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.marital_status || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Spouse Name</Label>
                      <p className="text-sm">
                        {selectedCandidate.spouse_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Spouse DOB</Label>
                      <p className="text-sm">
                        {selectedCandidate.spouse_dob
                          ? new Date(
                              selectedCandidate.spouse_dob
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Anniversary Date
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.anniversary_date
                          ? new Date(
                              selectedCandidate.anniversary_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        No. of Children
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.no_of_children || 0}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">
                        Annual Family Income
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.annual_family_income > 0
                          ? `₹${parseInt(
                              selectedCandidate.annual_family_income
                            ).toLocaleString()}`
                          : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Health Vitals */}
                {selectedCandidate.health_vitals &&
                  selectedCandidate.health_vitals.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Health Vitals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedCandidate.health_vitals.map(
                            (vital, index) => (
                              <div
                                key={vital.vital_id || index}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h5 className="font-semibold">
                                      Vital Record #{index + 1}
                                    </h5>
                                    <p className="text-sm text-muted-foreground">
                                      Recorded:{" "}
                                      {new Date(
                                        vital.record_date
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {vital.created_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Created:{" "}
                                      {new Date(
                                        vital.created_at
                                      ).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <Label className="font-medium">
                                      Height
                                    </Label>
                                    <p>{vital.height_cm || "N/A"} cm</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">
                                      Weight
                                    </Label>
                                    <p>{vital.weight_kg || "N/A"} kg</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">BMI</Label>
                                    <p>{vital.bmi || "N/A"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">BP</Label>
                                    <p>
                                      {vital.bp_systolic && vital.bp_diastolic
                                        ? `${vital.bp_systolic}/${vital.bp_diastolic} mmHg`
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Pulse</Label>
                                    <p>{vital.pulse_bpm || "N/A"} bpm</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">
                                      Fasting Sugar
                                    </Label>
                                    <p>
                                      {vital.blood_sugar_fasting || "N/A"} mg/dL
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">
                                      PP Sugar
                                    </Label>
                                    <p>{vital.blood_sugar_pp || "N/A"} mg/dL</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">
                                      Hemoglobin
                                    </Label>
                                    <p>{vital.hemoglobin || "N/A"} g/dL</p>
                                  </div>
                                </div>
                                {vital.notes && (
                                  <div className="mt-3 pt-3 border-t">
                                    <Label className="font-medium">Notes</Label>
                                    <p className="text-sm">{vital.notes}</p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Health Reports */}
                {selectedCandidate.health_reports &&
                  selectedCandidate.health_reports.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Health Reports</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedCandidate.health_reports.map(
                            (report, index) => (
                              <div
                                key={report.report_id || index}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {report.report_type}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Date:{" "}
                                    {new Date(
                                      report.report_date
                                    ).toLocaleDateString()}
                                  </div>
                                  {report.description && (
                                    <div className="text-sm mt-1">
                                      {report.description}
                                    </div>
                                  )}
                                </div>
                                {report.file_url ? (
                                  <a
                                    href={report.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline hover:text-primary/80 flex items-center gap-1"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Report
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    No file available
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                        {(!selectedCandidate.health_reports ||
                          selectedCandidate.health_reports.length === 0) && (
                          <p className="text-sm text-muted-foreground">
                            No health reports available.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                {/* Address & Location */}
                <Card>
                  <CardHeader>
                    <CardTitle>Address & Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Address</Label>
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedCandidate.address_line || "N/A"}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">State</Label>
                        <p className="text-sm">
                          {selectedCandidate.state || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">District</Label>
                        <p className="text-sm">
                          {selectedCandidate.district || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Mobilizer</Label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm">
                            {selectedCandidate.mobilizer_name || "N/A"}
                          </p>
                          {selectedCandidate.mobilizer_contact &&
                            selectedCandidate.mobilizer_contact !== "+91" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleCallCandidate(selectedCandidate)
                                }
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                            )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCandidate.documents &&
                    selectedCandidate.documents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCandidate.documents.map((doc) => (
                          <div
                            key={doc.documentId || doc.candidate_id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <div className="font-medium capitalize">
                                {doc.doc_type}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Uploaded:{" "}
                                {doc.uploaded_at
                                  ? new Date(doc.uploaded_at).toLocaleString()
                                  : "N/A"}
                                <br />
                                By: {doc.uploaded_by || "N/A"}
                              </div>
                            </div>
                            {doc.file_url ? (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline hover:text-primary/80"
                              >
                                <Eye className="h-4 w-4 inline mr-1" />
                                View Document
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No URL
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No documents available.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Status & Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status & Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <p className="text-sm">
                        <Badge
                          className={getStatusColor(selectedCandidate.status)}
                        >
                          {selectedCandidate.status || "N/A"}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm">
                        {selectedCandidate.notes || "No notes"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created At</Label>
                      <p className="text-sm">
                        {selectedCandidate.created_at
                          ? new Date(
                              selectedCandidate.created_at
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Updated At</Label>
                      <p className="text-sm">
                        {selectedCandidate.updated_at
                          ? new Date(
                              selectedCandidate.updated_at
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">
                        Student Reference
                      </Label>
                      <p className="text-sm">
                        {selectedCandidate.student_ref_name ? (
                          <>
                            {selectedCandidate.student_ref_name} -{" "}
                            {selectedCandidate.student_ref_mobile || "N/A"}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
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
                        className="flex-1"
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
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
