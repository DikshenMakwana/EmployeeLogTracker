import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UserTable } from "@/components/admin/user-table";

export default function UserManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <UserTable />
      </div>
    </DashboardLayout>
  );
}
