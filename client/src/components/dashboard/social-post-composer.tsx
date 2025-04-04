import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

export default function SocialPostComposer() {
  const [platform, setPlatform] = useState("twitter");
  const [content, setContent] = useState("");
  const [postingMode, setPostingMode] = useState("now");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/social-posts/generate", {});
      return response.json();
    },
    onSuccess: (data) => {
      setContent(data.content);
    },
    onError: (error) => {
      toast({
        title: "Error generating post",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const postMutation = useMutation({
    mutationFn: async () => {
      const postData = {
        platform,
        content,
        status: "published",
        scheduledAt: postingMode === "schedule" ? new Date(Date.now() + 3600000).toISOString() : null,
      };
      
      const response = await apiRequest("POST", "/api/social-posts", postData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post created",
        description: postingMode === "schedule" 
          ? "Your post has been scheduled" 
          : "Your post has been published",
      });
      setContent("");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleGeneratePost = () => {
    generateMutation.mutate();
  };

  const handlePostSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Cannot submit empty post",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }
    
    postMutation.mutate();
  };

  const characterCount = content.length;
  const maxCharacters = 280;

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold">Social Post Composer</h3>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Platform</label>
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
            <label className="block text-sm font-medium mb-1">Content</label>
            <div className="mt-1">
              <Textarea
                rows={3}
                placeholder="Type your post content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={maxCharacters}
                className="resize-none"
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>AI suggestion available</span>
              <span>{characterCount}/{maxCharacters}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Schedule</label>
            <RadioGroup 
              value={postingMode} 
              onValueChange={setPostingMode}
              className="flex space-x-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="post-now" />
                <label htmlFor="post-now" className="text-sm">Post Now</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="schedule" id="post-schedule" />
                <label htmlFor="post-schedule" className="text-sm">Schedule</label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2 pt-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleGeneratePost}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                "Generate AI Post About Current Yields"
              )}
            </Button>
            
            <Button 
              className="w-full"
              onClick={handlePostSubmit}
              disabled={postMutation.isPending || !content.trim()}
            >
              {postMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</>
              ) : (
                postingMode === "schedule" ? "Schedule Post" : "Post Now"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
