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
import { Trash2 } from "lucide-react";
import { type Log, type User } from "@shared/schema";

export function LogTable() {
  const { toast } = useToast();
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Created At</TableHead>
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
                  {log.content}
                </TableCell>
                <TableCell>{format(new Date(log.createdAt), "PPp")}</TableCell>
                <TableCell>
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
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No logs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}