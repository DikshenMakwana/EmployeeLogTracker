import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Log, type User } from "@shared/schema";

type MonthlyStats = {
  totalWordCount: number;
  averageWordCount: number;
  totalEntries: number;
};

export function LogTable() {
  const { toast } = useToast();
  const [editingLog, setEditingLog] = useState<Log | null>(null);

  const editLog = useMutation({
    mutationFn: async (data: Log) => {
      const res = await apiRequest("PUT", `/api/logs/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      setEditingLog(null);
      toast({
        title: "Success",
        description: "Log updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const { data: logs = [] } = useQuery<Log[]>({
    queryKey: ["/api/admin/logs"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const deleteLog = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({
        title: "Success",
        description: "Log deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate monthly statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
  });

  const editForm = useForm({
    resolver: zodResolver(insertLogSchema),
    defaultValues: {
      task: editingLog?.task || "",
      wordCount: editingLog?.wordCount || 0,
      date: editingLog?.date || new Date(),
      userId: editingLog?.userId,
    },
  });

  useEffect(() => {
    if (editingLog) {
      editForm.reset({
        task: editingLog.task,
        wordCount: editingLog.wordCount,
        date: new Date(editingLog.date),
        userId: editingLog.userId,
      });
    }
  }, [editingLog]);

  const onEditSubmit = async (data: InsertLog) => {
    if (!editingLog) return;
    await editLog.mutateAsync({ ...data, id: editingLog.id });
  };

  const monthlyStats: MonthlyStats = {
    totalWordCount: monthlyLogs.reduce((sum, log) => sum + log.wordCount, 0),
    averageWordCount: Math.round(monthlyLogs.reduce((sum, log) => sum + log.wordCount, 0) / (monthlyLogs.length || 1)),
    totalEntries: monthlyLogs.length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Word Count</div>
          <div className="text-2xl font-bold">{monthlyStats.totalWordCount}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Average Words/Entry</div>
          <div className="text-2xl font-bold">{monthlyStats.averageWordCount}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Entries</div>
          <div className="text-2xl font-bold">{monthlyStats.totalEntries}</div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="text-right">Word Count</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const user = users.find((u: User) => u.id === log.userId);
              return (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.date), "PP")}</TableCell>
                  <TableCell>{user?.fullName}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {log.task}
                  </TableCell>
                  <TableCell className="text-right">{log.wordCount}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingLog(log)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLog.mutate(log.id)}
                      disabled={deleteLog.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            <Dialog open={!!editingLog} onOpenChange={() => setEditingLog(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Log Entry</DialogTitle>
                </DialogHeader>
                {editingLog && (
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      <FormField
                        control={editForm.control}
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
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
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
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={editLog.isPending}
                      >
                        {editLog.isPending ? "Updating..." : "Update Log"}
                      </Button>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              <TableRow className="font-medium">
                <TableCell colSpan={3}>Monthly Total</TableCell>
                <TableCell className="text-right">{monthlyStats.totalWordCount}</TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}