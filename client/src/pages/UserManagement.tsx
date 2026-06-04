import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Mail,
  Clock,
  RefreshCw,
  XCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  isActiveClient: number;
  createdAt: Date;
  lastSignedIn: Date;
}

interface Invite {
  id: number;
  email: string;
  role: string;
  status: string;
  inviteToken: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
}

export default function UserManagement({ embedded = false }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState<{ email: string; inviteUrl: string } | null>(null);
  const [showOldInvites, setShowOldInvites] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading, refetch } = trpc.admin.getAllUsers.useQuery();

  // Fetch all invites
  const { data: allInvites = [], refetch: refetchInvites } = trpc.invites.getAllInvites.useQuery();

  // Split invites into pending vs. historical
  const pendingInvites = useMemo(
    () => (allInvites as Invite[]).filter((i) => i.status === "pending"),
    [allInvites]
  );
  const oldInvites = useMemo(
    () => (allInvites as Invite[]).filter((i) => i.status !== "pending"),
    [allInvites]
  );

  // Create invite mutation
  const createInviteMutation = trpc.invites.createInvite.useMutation({
    onSuccess: (data) => {
      const appUrl = window.location.origin;
      setInviteSuccess({
        email: inviteEmail,
        inviteUrl: `${appUrl}/accept-invite/${data.inviteToken}`,
      });
      setInviteEmail("");
      refetchInvites();
      toast.success(`Invite sent to ${data.email}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invite");
    },
  });

  // Resend invite mutation
  const resendInviteMutation = trpc.invites.resendInvite.useMutation({
    onSuccess: (data) => {
      refetchInvites();
      toast.success(`Invite resent to ${data.email}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invite");
    },
  });

  // Revoke invite mutation
  const revokeInviteMutation = trpc.invites.revokeInvite.useMutation({
    onSuccess: () => {
      refetchInvites();
      toast.success("Invite revoked");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke invite");
    },
  });

  // Update user role mutation
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      setSelectedUserId(null);
      setSelectedRole("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  // Toggle client access mutation
  const toggleAccessMutation = trpc.admin.toggleClientAccess.useMutation({
    onSuccess: () => {
      toast.success("User access updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user access");
    },
  });

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u: User) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (u.name?.toLowerCase().includes(searchLower) || false) ||
        (u.email?.toLowerCase().includes(searchLower) || false)
      );
    });
  }, [users, searchQuery]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-[#E8425A]";
      case "athlete":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusBadge = (isActive: number) => {
    return isActive === 1 ? (
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-600">Active</span>
      </div>
    ) : (
      <div className="flex items-center gap-1">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <span className="text-sm text-red-600">Inactive</span>
      </div>
    );
  };

  const getInviteStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Accepted</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatExpiry = (expiresAt: Date) => {
    const now = new Date();
    const exp = new Date(expiresAt);
    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;
    createInviteMutation.mutate({ email: inviteEmail.trim() });
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteEmail("");
    setInviteSuccess(null);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You do not have permission to access this page. Admin access required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${embedded ? "" : "min-h-screen bg-background"} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        {!embedded && (
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-muted-foreground">
                Manage user roles, access permissions, and athlete invitations
              </p>
            </div>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="flex items-center gap-2 shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              Invite Athlete
            </Button>
          </div>
        )}

        {embedded && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite Athlete
            </Button>
          </div>
        )}

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <Card className="mb-6 border-yellow-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-base">Pending Invitations</CardTitle>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ml-auto">
                  {pendingInvites.length}
                </Badge>
              </div>
              <CardDescription>
                These athletes have been invited but haven't signed up yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {invite.email}
                          </div>
                        </TableCell>
                        <TableCell>{getInviteStatusBadge(invite.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatExpiry(invite.expiresAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendInviteMutation.mutate({ inviteId: invite.id })}
                              disabled={resendInviteMutation.isPending}
                              title="Resend invite email"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => revokeInviteMutation.mutate({ inviteId: invite.id })}
                              disabled={revokeInviteMutation.isPending}
                              title="Revoke this invite"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Revoke
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Total: {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u: User) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "—"}</TableCell>
                        <TableCell className="text-sm">{u.email || "—"}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(u.role)}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(u.isActiveClient)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {/* Toggle Active Status */}
                            <Button
                              size="sm"
                              variant={u.isActiveClient === 1 ? "outline" : "default"}
                              onClick={() =>
                                toggleAccessMutation.mutate({
                                  userId: u.id,
                                  isActive: u.isActiveClient === 0,
                                })
                              }
                              disabled={toggleAccessMutation.isPending}
                            >
                              {u.isActiveClient === 1 ? "Deactivate" : "Activate"}
                            </Button>

                            {/* Change Role */}
                            {selectedUserId === u.id ? (
                              <div className="flex gap-2">
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="athlete">Athlete</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (selectedRole) {
                                      updateRoleMutation.mutate({
                                        userId: u.id,
                                        role: selectedRole,
                                      });
                                    }
                                  }}
                                  disabled={!selectedRole || updateRoleMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUserId(null);
                                    setSelectedRole("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserId(u.id);
                                  setSelectedRole(u.role);
                                }}
                              >
                                Change Role
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historical Invites (collapsed) */}
        {oldInvites.length > 0 && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground flex items-center gap-1"
              onClick={() => setShowOldInvites((v) => !v)}
            >
              {showOldInvites ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showOldInvites ? "Hide" : "Show"} past invitations ({oldInvites.length})
            </Button>
            {showOldInvites && (
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Accepted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {oldInvites.map((invite) => (
                          <TableRow key={invite.id} className="opacity-60">
                            <TableCell className="font-medium">{invite.email}</TableCell>
                            <TableCell>{getInviteStatusBadge(invite.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(invite.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {invite.acceptedAt
                                ? new Date(invite.acceptedAt).toLocaleDateString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Invite Athlete Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => { if (!open) handleCloseInviteDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Athlete
            </DialogTitle>
            <DialogDescription>
              Send an invitation email with a secure sign-up link. The invite expires in 7 days.
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            /* Success state */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Invite sent to {inviteSuccess.email}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Invite link (backup copy)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteSuccess.inviteUrl}
                    className="text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteSuccess.inviteUrl);
                      toast.success("Link copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You can share this link directly if the email doesn't arrive. It expires in 7 days.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteSuccess(null)}>
                  Invite Another
                </Button>
                <Button onClick={handleCloseInviteDialog}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            /* Input state */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Athlete's email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="athlete@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inviteEmail.trim()) handleSendInvite();
                  }}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The athlete will receive an email with a link to create their account. Once they sign up, they'll automatically be assigned the <strong>Athlete</strong> role and granted access to their drills.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseInviteDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim() || createInviteMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createInviteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send Invite
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
