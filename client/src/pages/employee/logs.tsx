import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { type Log } from "@shared/schema";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EmployeeLogs() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: logs = [] } = useQuery<Log[]>({
    queryKey: [`/api/logs/${user?.id}`],
    enabled: !!user,
  });

  // Calculate monthly statistics
  const monthlyLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    return logDate.getMonth() === selectedMonth && logDate.getFullYear() === selectedYear;
  });

  const monthlyTotal = monthlyLogs.reduce((sum, log) => sum + log.wordCount, 0);
  const monthlyAverage = Math.round(monthlyTotal / (monthlyLogs.length || 1));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Logs</h1>
          <select 
            className="border rounded-md px-3 py-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">Monthly Word Count</div>
            <div className="text-2xl font-bold">{monthlyTotal}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">Average Words/Day</div>
            <div className="text-2xl font-bold">{monthlyAverage}</div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="text-right">Word Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.date), "PP")}</TableCell>
                  <TableCell className="max-w-[500px]">{log.task}</TableCell>
                  <TableCell className="text-right">{log.wordCount}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow className="font-medium">
                  <TableCell colSpan={2}>Monthly Total</TableCell>
                  <TableCell className="text-right">{monthlyTotal}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}