import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2, Twitter, Hash, MessageSquare, Filter, Plus, Trash2, Edit, Send, Clock } from "lucide-react";

interface SocialPost {
  id: number;
  platform: string;
  content: string;
  status: string;
  timestamp: string;
  scheduledAt: string | null;
  opportunityId: number | null;
}

export default function SocialPosts() {
  const [activeTab, setActiveTab] = useState("published");
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: posts, isLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/social-posts"],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/social-posts/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "The social post has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
    }
  });
  
  const filteredPosts = posts?.filter(post => {
    // Filter by platform
    if (platformFilter !== "all" && post.platform !== platformFilter) {
      return false;
    }
    
    // Filter by status (tab)
    return post.status.toLowerCase() === activeTab;
  });
  
  const handleDeletePost = (id: number) => {
    deleteMutation.mutate(id);
  };
  
  return (
    <div>
      <Header title="Social Posts" />
      
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold">Social Media Management</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Create and manage posts across your social platforms
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="farcaster">Farcaster</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Social Post</DialogTitle>
                  <DialogDescription>
                    Create a new post to share on your social platforms
                  </DialogDescription>
                </DialogHeader>
                <NewPostForm onSuccess={() => {
                  setShowNewPostDialog(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Posts</h3>
              {!isLoading && filteredPosts?.length === 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowNewPostDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Post
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(null).map((_, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex space-x-2 items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-20 w-full mb-3" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map(post => (
                  <div key={post.id} className="border rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex space-x-2 items-center">
                        {post.platform === "twitter" ? (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Twitter className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Hash className="h-4 w-4 text-purple-600" />
                          </div>
                        )}
                        <span className="font-medium">
                          {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                        </span>
                      </div>
                      <Badge variant="outline" className={cn(
                        post.status === "published" && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                        post.status === "scheduled" && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
                        post.status === "draft" && "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                      )}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="mb-3 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {post.status === "published" ? (
                          <>Posted: {new Date(post.timestamp).toLocaleString()}</>
                        ) : post.status === "scheduled" && post.scheduledAt ? (
                          <>Scheduled for: {new Date(post.scheduledAt).toLocaleString()}</>
                        ) : (
                          <>Created: {new Date(post.timestamp).toLocaleString()}</>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No {activeTab} posts</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                  {activeTab === "published" ? (
                    "You haven't published any posts yet."
                  ) : activeTab === "scheduled" ? (
                    "You have no scheduled posts."
                  ) : (
                    "You have no draft posts."
                  )}
                </p>
                <Button onClick={() => setShowNewPostDialog(true)}>
                  Create Your First Post
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <SocialAnalytics />
      </div>
    </div>
  );
}

function NewPostForm({ onSuccess }: { onSuccess: () => void }) {
  const [platform, setPlatform] = useState("twitter");
  const [content, setContent] = useState("");
  const [postingMode, setPostingMode] = useState("now");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/social-posts/generate", {});
      return response.json();
    },
    onSuccess: (data) => {
      setContent(data.content);
    }
  });
  
  const postMutation = useMutation({
    mutationFn: async () => {
      const postData = {
        platform,
        content,
        status: postingMode === "now" ? "published" : (postingMode === "schedule" ? "scheduled" : "draft"),
        scheduledAt: postingMode === "schedule" && scheduledDate ? scheduledDate.toISOString() : null,
      };
      
      const response = await apiRequest("POST", "/api/social-posts", postData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post created",
        description: postingMode === "now" 
          ? "Your post has been published" 
          : (postingMode === "schedule" 
              ? "Your post has been scheduled" 
              : "Your post has been saved as a draft"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      onSuccess();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Cannot submit empty post",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }
    
    if (postingMode === "schedule" && !scheduledDate) {
      toast({
        title: "Schedule date required",
        description: "Please select a date and time to schedule this post",
        variant: "destructive",
      });
      return;
    }
    
    postMutation.mutate();
  };

  const characterCount = content.length;
  const maxCharacters = 280;
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium">Platform</label>
            <span className="text-xs text-neutral-500">{characterCount}/{maxCharacters}</span>
          </div>
          <Tabs 
            defaultValue="twitter" 
            value={platform} 
            onValueChange={setPlatform} 
            className="w-full"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="twitter">Twitter</TabsTrigger>
              <TabsTrigger value="farcaster">Farcaster</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div>
          <label className="text-sm font-medium">Content</label>
          <div className="mt-1">
            <Textarea
              rows={4}
              placeholder="Type your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={maxCharacters}
              className="resize-none"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Posting Options</label>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              type="button"
              variant={postingMode === "now" ? "default" : "outline"}
              className="justify-start"
              onClick={() => setPostingMode("now")}
            >
              <Send className="mr-2 h-4 w-4" />
              Post Now
            </Button>
            <Button 
              type="button"
              variant={postingMode === "schedule" ? "default" : "outline"}
              className="justify-start"
              onClick={() => setPostingMode("schedule")}
            >
              <Clock className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button 
              type="button"
              variant={postingMode === "draft" ? "default" : "outline"}
              className="justify-start"
              onClick={() => setPostingMode("draft")}
            >
              <Edit className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>
        </div>
        
        {postingMode === "schedule" && (
          <div>
            <label className="text-sm font-medium mb-1 block">Schedule Date & Time</label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !scheduledDate && "text-neutral-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Input 
                type="time" 
                className="w-32" 
                onChange={(e) => {
                  if (e.target.value && scheduledDate) {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = new Date(scheduledDate);
                    newDate.setHours(hours, minutes);
                    setScheduledDate(newDate);
                  }
                }}
              />
            </div>
          </div>
        )}
        
        <Button 
          type="button"
          variant="outline" 
          className="w-full"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            "Generate AI Post About Current Yields"
          )}
        </Button>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={postMutation.isPending || content.trim() === ""}>
          {postMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {postingMode === "now" ? "Post Now" : (postingMode === "schedule" ? "Schedule Post" : "Save Draft")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function SocialAnalytics() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <h3 className="font-bold">Social Media Analytics</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Total Posts</div>
            <div className="text-2xl font-bold mt-1">24</div>
            <div className="text-xs text-green-500 mt-1">+3 this week</div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Engagement Rate</div>
            <div className="text-2xl font-bold mt-1">3.2%</div>
            <div className="text-xs text-green-500 mt-1">+0.5% from last week</div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Most Engaging Topic</div>
            <div className="text-xl font-bold mt-1">Yield Farming</div>
            <div className="text-xs text-neutral-500 mt-1">5.8% engagement rate</div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-4">
            Content Performance by Topic
          </h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Yield Farming</span>
                <span className="text-sm font-medium">5.8%</span>
              </div>
              <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="bg-primary-500 h-full" style={{ width: '58%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Market Updates</span>
                <span className="text-sm font-medium">4.2%</span>
              </div>
              <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="bg-primary-500 h-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Protocol Analyses</span>
                <span className="text-sm font-medium">3.5%</span>
              </div>
              <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="bg-primary-500 h-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Educational Content</span>
                <span className="text-sm font-medium">2.9%</span>
              </div>
              <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="bg-primary-500 h-full" style={{ width: '29%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline">Download Full Analytics Report</Button>
      </CardFooter>
    </Card>
  );
}
