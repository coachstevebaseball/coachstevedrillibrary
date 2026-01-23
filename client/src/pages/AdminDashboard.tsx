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
import { Loader2, Users, Shield, CheckCircle2, XCircle, Mail, Copy, Trash2, RotateCcw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import * as React from "react";
import { BulkImportDrills } from "@/components/BulkImportDrills";
import { SingleVideoUpload } from "@/components/SingleVideoUpload";
import { AddNewDrill } from "@/components/AddNewDrill";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Move useEffect to the top before any conditional returns
  useEffect(() => {
    if (!user && !authLoading) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

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

  // Invite management
  const { data: allInvites = [], isLoading: invitesLoading } = trpc.invites.getAllInvites.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const createInviteMutation = trpc.invites.createInvite.useMutation({
    onSuccess: () => {
      utils.invites.getAllInvites.invalidate();
      toast.success("Invite created successfully!");
      setNewInviteEmail("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invite");
    },
  });

  const resendInviteMutation = trpc.invites.resendInvite.useMutation({
    onSuccess: () => {
      utils.invites.getAllInvites.invalidate();
      toast.success("Invite resent successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invite");
    },
  });

  const revokeInviteMutation = trpc.invites.revokeInvite.useMutation({
    onSuccess: () => {
      utils.invites.getAllInvites.invalidate();
      toast.success("Invite revoked successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke invite");
    },
  });

  const [newInviteEmail, setNewInviteEmail] = React.useState("");

  const handleCreateInvite = () => {
    if (!newInviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    createInviteMutation.mutate({ email: newInviteEmail });
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard!");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
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
            <div className="flex gap-3 flex-wrap">
              <AddNewDrill />
              <SingleVideoUpload />
              <BulkImportDrills />
              <Link href="/coach">
                <Button variant="secondary">Coach Dashboard</Button>
              </Link>
              <Link href="/drills">
                <Button variant="secondary">View Drills</Button>
              </Link>
            </div>
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

      {/* Invite Management Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Athletes
          </CardTitle>
          <CardDescription>Generate and manage athlete invitations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Invite Form */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Create New Invite</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="athlete@example.com"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateInvite()}
                className="flex-1 px-3 py-2 border rounded-md border-input bg-background text-sm"
              />
              <Button
                onClick={handleCreateInvite}
                disabled={createInviteMutation.isPending || !newInviteEmail}
              >
                {createInviteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Create Invite
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Invites List */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Pending & Accepted Invites</label>
            {invitesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : allInvites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No invites created yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allInvites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            invite.status === "accepted"
                              ? "default"
                              : invite.status === "expired"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {invite.status === "accepted" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {invite.status === "expired" && <XCircle className="h-3 w-3 mr-1" />}
                          {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {invite.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyInviteLink(invite.inviteToken)}
                            title="Copy invite link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resendInviteMutation.mutate({ inviteId: invite.id })}
                            disabled={resendInviteMutation.isPending}
                            title="Resend invite"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => revokeInviteMutation.mutate({ inviteId: invite.id })}
                            disabled={revokeInviteMutation.isPending}
                            className="text-destructive hover:text-destructive"
                            title="Revoke invite"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {invite.status === "accepted" && (
                        <span className="text-xs text-muted-foreground">
                          Accepted {new Date(invite.acceptedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      </main>
    </div>
  );
}
