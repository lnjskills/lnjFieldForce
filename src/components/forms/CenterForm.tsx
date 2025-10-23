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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAddCenterMutation } from "@/store/slices/apiSlice";

// Define interfaces locally
interface AddCenterPayload {
  center_name: string;
  full_address: string;
  state: string;
  city: string;
  capacity: number;
  center_manager: string;
  center_contact_person: number;
}

const formSchema = z.object({
  name: z.string().min(2, "Center name is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(5, "Address is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  manager: z.string().min(2, "Center manager is required"),
  managerContact: z.coerce.number().min(10, "Valid phone number is required"),
  status: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CenterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId?: number;
}

export function CenterForm({ open, onOpenChange, itemId }: CenterFormProps) {
  const { toast } = useToast();
  const [addCenter, { isLoading: adding }] = useAddCenterMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      state: "",
      city: "",
      address: "",
      capacity: 30,
      manager: "",
      managerContact: +91,
      status: true,
    },
  });

  // Mock data for editing (replace with actual API call when available)
  useEffect(() => {
    if (itemId) {
      // In a real app, you would fetch the center data by itemId
      console.log(`Editing center with ID: ${itemId}`);
      form.reset({
        name: `Training Center ${itemId}`,
        state: "Delhi",
        city: "New Delhi",
        address: "123 Main Street, Delhi",
        capacity: 30 + itemId,
        manager: `Manager ${itemId}`,
        managerContact: +91,
        status: true,
      });
    } else {
      form.reset({
        name: "",
        state: "",
        city: "",
        address: "",
        capacity: 30,
        manager: "",
        managerContact: +91,
        status: true,
      });
    }
  }, [itemId, form]);

  async function onSubmit(values: FormValues) {
    try {
      // Map form values to API payload
      const payload: AddCenterPayload = {
        center_name: values.name,
        full_address: values.address,
        state: values.state,
        city: values.city,
        capacity: values.capacity,
        center_manager: values.manager,
        center_contact_person: values.managerContact,
      };

      if (!itemId) {
        // Add new center
        const response = await addCenter(payload).unwrap();
        toast({
          title: "Center Added",
          description:
            response.message || `${values.name} has been added successfully`,
        });
      } else {
        // Mock edit behavior (replace with actual edit API when available)
        toast({
          title: "Center Updated",
          description: `${values.name} has been updated successfully`,
        });
      }

      onOpenChange(false);
      form.reset();
    } catch (err) {
      console.error("Add center error", err);
      const getErrorMessage = (e: unknown): string => {
        if (!e) return "An unknown error occurred";
        if (typeof e === "string") return e;
        if (typeof e === "object" && e !== null) {
          const maybe = e as { data?: { message?: string }; message?: string };
          return (
            maybe.data?.message ??
            maybe.message ??
            "An error occurred while processing the request"
          );
        }
        return "An error occurred while processing the request";
      };
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {itemId ? "Edit" : "Add New"} Training Center
          </DialogTitle>
          <DialogDescription>
            {itemId ? "Update existing" : "Create a new"} training center
            location
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Center Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="E.g. Delhi Training Center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Delhi">Delhi</SelectItem>
                        <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="Karnataka">Karnataka</SelectItem>
                        <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="Gujarat">Gujarat</SelectItem>
                        <SelectItem value="Uttar Pradesh">
                          Uttar Pradesh
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="E.g. New Delhi" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Center Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter full address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Capacity</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="1" />
                  </FormControl>
                  <FormDescription>
                    Maximum number of candidates this center can train
                    simultaneously
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Center Manager</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="E.g. Amit Singh" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="managerContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager Contact</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                      {/* <Input {...field} placeholder="E.g. 9876543210" /> */}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Set center as active for training operations
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {itemId ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
