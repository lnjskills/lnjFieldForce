import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useGetCentersListQuery,
  useAddUserMutation,
  useGetUserDetailQuery,
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
  state?: string;
  // Add other fields as needed
}

interface UserDetailResponse {
  count: number;
  data: User[];
}

interface AddUserPayload {
  name: string;
  phone: string;
  email: string;
  role: string;
  password: string;
  state?: string;
  assigned_center?: string;
}

interface Center {
  id: string | number;
  name?: string;
  centre_name?: string;
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.string().min(1, "Role is required"),
  assigned_center: z.string().optional(),
  state: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function UserForm({ open, onOpenChange, userId }: UserFormProps) {
  const { toast } = useToast();

  const { data: centersData, isLoading: centersLoading } =
    useGetCentersListQuery(undefined);

  const [addUser, { isLoading: adding }] = useAddUserMutation();

  const {
    data: userDetailResponse,
    isLoading: userLoading,
    isSuccess: userLoaded,
  } = useGetUserDetailQuery(userId!, { skip: !userId }) as {
    data: UserDetailResponse | undefined;
    isLoading: boolean;
    isSuccess: boolean;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      assigned_center: undefined,
      state: "",
      password: "",
    },
  });

  // Prefill when editing
  useEffect(() => {
    if (userId && userLoaded && userDetailResponse?.data?.[0]) {
      const userDetail = userDetailResponse.data[0];
      form.reset({
        name: userDetail.name ?? "",
        email: userDetail.email ?? "",
        phone: userDetail.phone ?? "",
        role: userDetail.role ?? "",
        assigned_center: userDetail.centre_id ?? undefined,
        state: userDetail.state ?? "",
        password: "",
      });
    } else if (!userId) {
      form.reset({
        name: "",
        email: "",
        phone: "",
        role: "",
        assigned_center: undefined,
        state: "",
        password: "",
      });
    }
  }, [userId, userLoaded, userDetailResponse, form]);

  async function onSubmit(values: FormValues) {
    try {
      // Transform role to title case to match API expectation (e.g., "trainer" -> "Trainer")
      // const role = values.role
      //   .split("_")
      //   .map(
      //     (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      //   )
      //   .join(" ");

      const payload: AddUserPayload = {
        name: values.name,
        phone: values.phone,
        email: values.email,
        role: values.role,
        password: values.password,
        state: values.state ?? "",
        ...(values.assigned_center !== undefined && {
          assigned_center: values.assigned_center,
        }),
      };

      await addUser(payload).unwrap();

      toast({
        title: userId ? "User Updated" : "User Added",
        description: `${values.name} has been ${userId ? "updated" : "added"}.`,
      });

      onOpenChange(false);
      form.reset();
    } catch (err) {
      console.error("User action error", err);
      const getErrorMessage = (e: unknown): string | undefined => {
        if (!e) return undefined;
        if (typeof e === "string") return e;
        if (typeof e === "object" && e !== null) {
          const maybe = e as { data?: { message?: string }; message?: string };
          return maybe.data?.message ?? maybe.message;
        }
        return undefined;
      };
      toast({
        title: "Error",
        description:
          getErrorMessage(err) ??
          `Unable to ${userId ? "update" : "add"} user. Please try again.`,
        variant: "destructive",
      });
    }
  }

  // Normalize centersData to handle both { data: Center[] } and Center[]
  const centers = centersData
    ? "data" in centersData
      ? centersData.data
      : Array.isArray(centersData)
      ? centersData
      : []
    : [];

  const showCenterField =
    form.watch("role") !== "super_admin" &&
    form.watch("role") !== "outreach_admin" &&
    form.watch("role") !== "accounts_team";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-auto ">
        <DialogHeader>
          <DialogTitle>{userId ? "Edit" : "Add New"} User</DialogTitle>
          <DialogDescription>
            {userId ? "Update existing" : "Create a new"} user account with
            role-based permissions
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter full name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter email address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter phone number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="state_head">State Head</SelectItem>
                      <SelectItem value="center_manager">
                        Center Manager
                      </SelectItem>
                      <SelectItem value="MOBILIZER">Mobilizer</SelectItem>
                      <SelectItem value="ppc_team">PPC Team</SelectItem>
                      <SelectItem value="COUNSELLOR">Counsellor</SelectItem>
                      <SelectItem value="Trainer">Trainer</SelectItem>
                      <SelectItem value="outreach_admin">
                        Outreach Admin
                      </SelectItem>
                      <SelectItem value="accounts_team">
                        Accounts Team
                      </SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCenterField && (
              <FormField
                control={form.control}
                name="assigned_center"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Center</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        field.onChange(value === "" ? undefined : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              centersLoading
                                ? "Loading centers..."
                                : "Select center"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centers.length > 0 ? (
                          centers.map((c: Center) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name ?? c.centre_name ?? `Center ${c.id}`}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="delhi">Delhi Center</SelectItem>
                            <SelectItem value="mumbai">
                              Mumbai Center
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter state" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{userId ? "Reset" : "Initial"} Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder={
                        userId ? "Reset password" : "Set initial password"
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    User will be prompted to change password on first login
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adding}>
                {userId ? "Update User" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
