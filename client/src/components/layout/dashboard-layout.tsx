import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ClipboardList, LogOut } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-primary text-white p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <ClipboardList className="h-6 w-6" />
          <h1 className="text-xl font-bold">LogBook</h1>
        </div>

        <nav className="space-y-2 flex-1">
          {user?.isAdmin ? (
            <>
              <Link href="/admin/dashboard">
                <a className="block px-4 py-2 rounded hover:bg-primary/80">Dashboard</a>
              </Link>
              <Link href="/admin/users">
                <a className="block px-4 py-2 rounded hover:bg-primary/80">Users</a>
              </Link>
            </>
          ) : (
            <Link href="/logs">
              <a className="block px-4 py-2 rounded hover:bg-primary/80">My Logs</a>
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-primary/20">
          <div className="mb-4 px-4">
            <div className="font-medium">{user?.fullName}</div>
            <div className="text-sm opacity-80">{user?.isAdmin ? "Admin" : "Employee"}</div>
          </div>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">{children}</div>
    </div>
  );
}