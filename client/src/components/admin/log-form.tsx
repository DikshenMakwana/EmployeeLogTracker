import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertLogSchema, type InsertLog, type User } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";

export function LogForm() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm<InsertLog>({
    resolver: zodResolver(insertLogSchema),
    defaultValues: {
      task: "",
      wordCount: 0,
      date: new Date(),
      userId: currentUser?.isAdmin ? undefined : currentUser?.id,
    },
  });

  const createLog = useMutation({
    mutationFn: async (data: InsertLog) => {
      // Ensure date is properly formatted as ISO string and userId is a number
      const formattedData = {
        ...data,
        userId: Number(data.userId),
        date: new Date(data.date).toISOString(),
        wordCount: Number(data.wordCount),
      };

      console.log("Submitting log data:", formattedData);
      const response = await apiRequest("POST", "/api/logs", formattedData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      form.reset();
      toast({
        title: "Success",
        description: "Log created successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to create log:", error);
      toast({
        title: "Error",
        description: "Failed to create log. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertLog) => {
    try {
      await createLog.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Log Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {currentUser?.isAdmin && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="task"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wordCount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Word count"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createLog.isPending}
            >
              {createLog.isPending ? "Creating..." : "Create Log"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}