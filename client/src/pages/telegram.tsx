import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, SendIcon, BotIcon, UserIcon, AlertCircle, CheckCircle } from "lucide-react";

export default function TelegramPage() {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Query to get Telegram users
  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/telegram/users'],
    retry: false
  });

  // Query to get bot status
  const { data: botStatus, isLoading: isBotStatusLoading } = useQuery<any>({
    queryKey: ['/api/telegram/status'],
    retry: false,
    // If the endpoint doesn't exist yet, we can handle errors gracefully
    enabled: false
  });

  // Initialize bot mutation
  const initBotMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/telegram/init', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Bot Initialized",
        description: "Telegram bot has been initialized successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to initialize Telegram bot: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Broadcast message mutation
  const broadcastMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest('/api/telegram/broadcast', 'POST', { message });
    },
    onSuccess: (data) => {
      toast({
        title: "Message Sent",
        description: `Message sent to ${data.sent} users.`,
      });
      setBroadcastMessage("");
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/telegram/users/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "Telegram user has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle broadcast message
  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to broadcast.",
        variant: "destructive",
      });
      return;
    }
    broadcastMutation.mutate(broadcastMessage);
  };

  // Handle user selection for detail view
  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Telegram Integration</h1>
          <p className="text-muted-foreground mt-2">
            Manage your YieldHunter Telegram bot and connected users
          </p>
        </div>
        
        <Button 
          onClick={() => initBotMutation.mutate()} 
          disabled={initBotMutation.isPending}
        >
          {initBotMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <BotIcon className="mr-2 h-4 w-4" />
              Initialize Bot
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Status</CardTitle>
            <CardDescription>
              Current status of your Telegram bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BotIcon className="h-6 w-6 mr-2 text-primary" />
              <div>
                <p className="text-sm font-medium">YieldHunter Bot</p>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Users</CardTitle>
            <CardDescription>
              Users connected via Telegram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                users?.length || 0
              )}
            </div>
            <p className="text-sm text-muted-foreground">Total users</p>
          </CardContent>
        </Card>

        {/* Broadcast Card */}
        <Card>
          <CardHeader>
            <CardTitle>Broadcast Message</CardTitle>
            <CardDescription>
              Send a message to all subscribed users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <SendIcon className="mr-2 h-4 w-4" />
                  Send Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Broadcast Message</DialogTitle>
                  <DialogDescription>
                    Send a message to all subscribed Telegram users.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBroadcastSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Message
                      </label>
                      <Input
                        id="message"
                        placeholder="Enter your message..."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={broadcastMutation.isPending || !broadcastMessage.trim()}
                    >
                      {broadcastMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Telegram Users</CardTitle>
          <CardDescription>
            Manage users connected to your Telegram bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableCaption>A list of your Telegram users.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Telegram ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Last Interaction</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.telegramId}</TableCell>
                    <TableCell>
                      {user.username ? `@${user.username}` : "-"}
                    </TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>
                      {user.preferences && (user.preferences as any).subscribed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.lastInteraction).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUserSelect(user)}
                        >
                          View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete the user from your Telegram bot database.
                                They will need to restart the bot to reconnect.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(user.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <UserIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No users yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Users will appear here once they connect to your Telegram bot.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Information about {selectedUser.firstName} {selectedUser.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Telegram ID</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.telegramId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Username</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.username ? `@${selectedUser.username}` : "No username"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">First Name</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.firstName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.lastName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Subscription Status</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.preferences && (selectedUser.preferences as any).subscribed
                      ? "Subscribed"
                      : "Not subscribed"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Interaction</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.lastInteraction).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Authentication Status</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.isAuthenticated ? "Authenticated" : "Not authenticated"}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete User</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the user from your Telegram bot database.
                      They will need to restart the bot to reconnect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteUserMutation.mutate(selectedUser.id);
                        setSelectedUser(null);
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}