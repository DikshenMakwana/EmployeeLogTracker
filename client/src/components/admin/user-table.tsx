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
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Edit } from "lucide-react";
import { type User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react';


export function UserTable() {
  const { toast } = useToast();
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
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

  const updateUser = useMutation({
    mutationFn: async (user: User) => {
      await apiRequest("PUT", `/api/admin/users/${user.id}`, user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Full Name</TableHead>
            <TableHead className="whitespace-nowrap">Username</TableHead>
            <TableHead className="whitespace-nowrap">Role</TableHead>
            <TableHead className="whitespace-nowrap w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.fullName}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                <Badge variant={user.isAdmin ? "default" : "secondary"}>
                  {user.isAdmin ? "Admin" : "Employee"}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Input
                          placeholder="Full Name"
                          value={editingUser?.fullName || ''}
                          onChange={(e) => setEditingUser(prev => prev ? {...prev, fullName: e.target.value} : null)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Input
                          placeholder="Username"
                          value={editingUser?.username || ''}
                          onChange={(e) => setEditingUser(prev => prev ? {...prev, username: e.target.value} : null)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Input
                          type="password"
                          placeholder="New Password (leave empty to keep current)"
                          value={editingUser?.password || ''}
                          onChange={(e) => setEditingUser(prev => prev ? {...prev, password: e.target.value} : null)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isAdmin"
                          checked={editingUser?.isAdmin || false}
                          onCheckedChange={(checked) => setEditingUser(prev => prev ? {...prev, isAdmin: checked} : null)}
                        />
                        <label htmlFor="isAdmin">Is Admin</label>
                      </div>
                      <Button onClick={() => editingUser && updateUser.mutate(editingUser)} disabled={updateUser.isPending}>
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={user.isAdmin || deleteUser.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this user? This action
                        cannot be undone and will also delete all associated logs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUser.mutate(user.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}