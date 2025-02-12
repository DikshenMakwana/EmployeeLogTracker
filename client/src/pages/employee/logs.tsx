import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Log } from "@shared/schema";
import { format } from "date-fns";

export default function EmployeeLogs() {
  const { user } = useAuth();

  const { data: logs = [] } = useQuery<Log[]>({
    queryKey: [`/api/logs/${user?.id}`],
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">My Logs</h1>
        
        <div className="grid gap-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(new Date(log.date), "MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{log.content}</p>
                <div className="mt-2 text-sm text-muted-foreground">
                  Created: {format(new Date(log.createdAt), "PPp")}
                </div>
              </CardContent>
            </Card>
          ))}

          {logs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No logs found.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
