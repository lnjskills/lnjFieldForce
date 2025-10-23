import React, { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Filter,
  Plus,
  Edit,
  UserMinus,
  RotateCw,
  User,
  Users,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserForm } from "@/components/forms/UserForm";
import { RoleMatrixForm } from "@/components/forms/RoleMatrixForm";
import {
  UserFilterDialog,
  UserFilters,
} from "@/components/dialogs/UserFilterDialog";
import { UserActionDialog } from "@/components/dialogs/UserActionDialog";
import { useToast } from "@/hooks/use-toast";
import {
  useGetUsersListQuery,
  useDeleteUserMutation,
} from "@/store/slices/apiSlice";

// Define interfaces locally
interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  centre_id: string;
  is_active: boolean;
}

interface UsersResponse {
  count: number;
  data: User[];
}

interface NormalizedUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  center: string;
  status: "active" | "inactive";
}

const UserManagement = () => {
  // State for dialog forms
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [roleMatrixOpen, setRoleMatrixOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [userActionDialog, setUserActionDialog] = useState<{
    open: boolean;
    type: "deactivate" | "reactivate" | "delete";
    userName: string;
    userId: string;
  }>({
    open: false,
    type: "deactivate",
    userName: "",
    userId: "",
  });
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>({
    role: "",
    center: "",
    status: "",
  });

  const { toast } = useToast();

  // Fetch users via RTK Query and wire delete mutation
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useGetUsersListQuery(undefined) as {
    data: UsersResponse | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };
  const [deleteUser] = useDeleteUserMutation();

  // Normalize API user shape for UI
  const normalizedUsers: NormalizedUser[] =
    usersData?.data?.map((user) => ({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      mobile: user.phone || "",
      role: user.role || "",
      center: user.centre_id || "", // Replace with name if mapping available
      status: user.is_active ? "active" : "inactive",
    })) || [];

  // Filter users based on search query and applied filters
  const filteredUsers = normalizedUsers.filter((user) => {
    // Search filtering
    if (
      searchQuery &&
      !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.mobile.includes(searchQuery)
    ) {
      return false;
    }

    // Role filtering
    if (
      appliedFilters.role &&
      appliedFilters.role !== "all" &&
      user.role.toLowerCase() !== appliedFilters.role.toLowerCase()
    ) {
      return false;
    }

    // Center filtering
    if (
      appliedFilters.center &&
      appliedFilters.center !== "all" &&
      !user.center.toLowerCase().includes(appliedFilters.center.toLowerCase())
    ) {
      return false;
    }

    // Status filtering
    if (
      appliedFilters.status &&
      appliedFilters.status !== "all" &&
      user.status !== appliedFilters.status
    ) {
      return false;
    }

    return true;
  });

  const handleEditUser = (userId: string) => {
    setEditUserId(userId);
    setUserFormOpen(true);
    toast({
      title: "Edit user",
      description: `Opening edit form for user #${userId}`,
    });
  };

  const handleUserAction = (
    type: "deactivate" | "reactivate" | "delete",
    user: { id: string; name: string }
  ) => {
    setUserActionDialog({
      open: true,
      type,
      userName: user.name,
      userId: user.id,
    });
  };

  const handleActionConfirm = async () => {
    const { type, userId } = userActionDialog;

    if (type === "delete") {
      try {
        await deleteUser(userId).unwrap();
        toast({
          title: "User deleted",
          description: `User #${userId} has been deleted.`,
        });
        refetchUsers();
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Unable to delete user. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUserActionDialog({ ...userActionDialog, open: false });
      }
    } else {
      toast({
        title: type === "deactivate" ? "Deactivated" : "Reactivated",
        description: `${userActionDialog.userName} has been ${
          type === "deactivate" ? "deactivated" : "reactivated"
        }.`,
      });
      setUserActionDialog({ ...userActionDialog, open: false });
    }
  };

  const handleApplyFilters = (filters: UserFilters) => {
    setAppliedFilters(filters);
  };

  return (
    <MainLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              User & Role Management
            </h1>
            <p className="text-muted-foreground">
              Manage user accounts and role permissions across the platform.
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setEditUserId(null);
              setUserFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add New User
          </Button>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="flex gap-2 items-center">
              <User className="h-4 w-4" />
              User Directory
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex gap-2 items-center">
              <Users className="h-4 w-4" />
              Role Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 pt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>User Directory</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="search"
                        placeholder="Search users..."
                        className="pl-8 max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => setFilterDialogOpen(true)}
                    >
                      <Filter className="h-3.5 w-3.5" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>List of all users in the system</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Center</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-10 text-muted-foreground"
                        >
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : usersError ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-10 text-muted-foreground"
                        >
                          Failed to load users. Please try again.
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No users match your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.mobile}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>{user.center}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditUser(user.id)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleUserAction(
                                    user.status === "active"
                                      ? "deactivate"
                                      : "reactivate",
                                    user
                                  )
                                }
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUserAction("delete", user)}
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="pt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Role Permission Matrix</CardTitle>
                  <Button onClick={() => setRoleMatrixOpen(true)}>
                    Configure Role Permissions
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Configure access permissions for each role in the system.
                </p>
                <div className="border rounded-md p-4">
                  <p className="text-center text-muted-foreground">
                    Click the button above to configure role permissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Form Dialog */}
      <UserForm
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        userId={editUserId}
      />

      <RoleMatrixForm open={roleMatrixOpen} onOpenChange={setRoleMatrixOpen} />

      <UserFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        onApplyFilter={handleApplyFilters}
      />

      <UserActionDialog
        type={userActionDialog.type}
        open={userActionDialog.open}
        onOpenChange={(open) =>
          setUserActionDialog({ ...userActionDialog, open })
        }
        userName={userActionDialog.userName}
        onConfirm={handleActionConfirm}
      />
    </MainLayout>
  );
};

export default UserManagement;
