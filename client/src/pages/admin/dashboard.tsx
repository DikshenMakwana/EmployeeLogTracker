import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTable } from "@/components/admin/user-table";
import { LogTable } from "@/components/admin/log-table";
import { LogForm } from "@/components/admin/log-form";
import { Users, FileText } from "lucide-react";

export default function AdminDashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["/api/admin/logs"],
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="space-y-4">
            <LogForm />
            <LogTable />
          </TabsContent>
          
          <TabsContent value="users">
            <UserTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
