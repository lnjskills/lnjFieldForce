import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  MessageCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MultiStageCounsellingDialog } from "@/components/dialogs/MultiStageCounsellingDialog";
import { ParentCounsellingDialog } from "@/components/dialogs/ParentCounsellingDialog";
import { DocumentComplianceDialog } from "@/components/dialogs/DocumentComplianceDialog";
import { useGetCandidatesListQuery } from "@/store/slices/apiSlice";

// In-memory storage for counselling sessions
let counsellingSessions = {};
let parentCoursellingSessions = {};

export default function CandidateManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [dialogType, setDialogType] = useState("");

  const {
    data: candidates = [],
    isLoading,
    error,
    refetch,
  } = useGetCandidatesListQuery();

  const itemsPerPage = 10;

  const filteredCandidates = candidates.filter((candidate) => {
    const name = candidate?.name?.toLowerCase() || "";
    const stage = candidate?.stage || "";
    const batch = candidate?.batch || "";

    return (
      name.includes(searchTerm.toLowerCase()) &&
      (selectedStage === "all" || stage === selectedStage) &&
      (selectedBatch === "all" || batch === selectedBatch)
    );
  });

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
      case "Generated":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Completed
          </Badge>
        );
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "Not Started":
        return <Badge variant="outline">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = (action, candidate) => {
    setSelectedCandidate(candidate);
    setDialogType(action);
  };

  const closeDialog = () => {
    setSelectedCandidate(null);
    setDialogType("");
  };

  const handleCounsellingUpdate = (candidateId, sessionData) => {
    counsellingSessions[candidateId] = sessionData;
    if (sessionData.currentStage) {
      // Note: Since we're using API data, you might want to refetch or update via API
    }
  };

  const handleParentCounsellingUpdate = (candidateId, sessionData) => {
    parentCoursellingSessions[candidateId] = sessionData;
    if (sessionData.consent) {
      // Similar note as above
    }
  };

  if (isLoading) {
    return (
      <MainLayout role="counsellor">
        <div className="flex justify-center items-center h-screen">
          <div>Loading candidates...</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout role="counsellor">
        <div className="flex justify-center items-center h-screen">
          <div className="text-red-500">
            Error loading candidates: {error?.data?.message || String(error)}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="counsellor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">
            Candidate Management
          </h1>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Name/ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="Stage 1">Stage 1</SelectItem>
                  <SelectItem value="Stage 2">Stage 2</SelectItem>
                  <SelectItem value="Stage 3">Stage 3</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  <SelectItem value="Batch 2025-01">Batch 2025-01</SelectItem>
                  <SelectItem value="Batch 2025-02">Batch 2025-02</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate Name</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Current Stage</TableHead>
                  <TableHead>Parent Counselling</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">
                      {candidate.first_name}
                    </TableCell>
                    <TableCell>{candidate.batch}</TableCell>
                    <TableCell>{candidate.stage}</TableCell>
                    <TableCell>
                      {getStatusBadge(candidate.parentCounselling)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction("counselling", candidate)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction("parent", candidate)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction("documents", candidate)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredCandidates.length)}{" "}
                of {filteredCandidates.length} candidates
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        {dialogType === "counselling" && selectedCandidate && (
          <MultiStageCounsellingDialog
            candidate={selectedCandidate}
            open={true}
            onClose={closeDialog}
            onUpdate={(sessionData) =>
              handleCounsellingUpdate(selectedCandidate.id, sessionData)
            }
          />
        )}
        {dialogType === "parent" && selectedCandidate && (
          <ParentCounsellingDialog
            candidate={selectedCandidate}
            open={true}
            onClose={closeDialog}
            onUpdate={(sessionData) =>
              handleParentCounsellingUpdate(selectedCandidate.id, sessionData)
            }
          />
        )}
        {dialogType === "documents" && selectedCandidate && (
          <DocumentComplianceDialog
            candidate={selectedCandidate}
            open={true}
            onClose={closeDialog}
            counsellingData={counsellingSessions[selectedCandidate.id]}
            parentCounsellingData={
              parentCoursellingSessions[selectedCandidate.id]
            }
            onEditCounselling={() =>
              handleAction("counselling", selectedCandidate)
            }
            onEditParentCounselling={() =>
              handleAction("parent", selectedCandidate)
            }
          />
        )}
      </div>
    </MainLayout>
  );
}
