import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Shield, CheckCircle2, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: allUsers, isLoading } = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const toggleAccess = trpc.admin.toggleClientAccess.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
      toast.success("Client access updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update client access");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeClients = allUsers?.filter((u) => u.isActiveClient === 1).length || 0;
  const totalUsers = allUsers?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">Admin Dashboard</h1>
              <p className="text-primary-foreground/80">
                Manage client access to the drills directory
              </p>
            </div>
            <Link href="/">
              <Button variant="secondary">Back to Directory</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="h-6 w-6 text-muted-foreground" />
                {totalUsers}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Clients</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                {activeClients}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Inactive Clients</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-6 w-6" />
                {totalUsers - activeClients}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Client Access Management</CardTitle>
            <CardDescription>
              Toggle client access to the drills directory. Only active clients can view drill content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead className="text-right">Access Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers?.map((clientUser) => (
                  <TableRow key={clientUser.id}>
                    <TableCell className="font-medium">
                      {clientUser.name || "Unknown"}
                    </TableCell>
                    <TableCell>{clientUser.email || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={clientUser.role === "admin" ? "default" : "secondary"}>
                        {clientUser.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {clientUser.isActiveClient === 1 ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {clientUser.lastSignedIn
                        ? new Date(clientUser.lastSignedIn).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-muted-foreground">
                          {clientUser.isActiveClient === 1 ? "Enabled" : "Disabled"}
                        </span>
                        <Switch
                          checked={clientUser.isActiveClient === 1}
                          onCheckedChange={(checked) =>
                            toggleAccess.mutate({
                              userId: clientUser.id,
                              isActive: checked,
                            })
                          }
                          disabled={clientUser.role === "admin" || toggleAccess.isPending}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
