import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageSquare, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: number;
  type: string;
  description: string;
  details: Record<string, any>;
  timestamp: string;
  userId: number | null;
}

export default function RecentActivity() {
  const { data, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities/recent"],
  });

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold">Recent Activity</h3>
      </CardHeader>
      
      <CardContent className="max-h-80 overflow-y-auto">
        <div className="flow-root">
          <ul className="-mb-8">
            {isLoading ? (
              // Loading skeletons
              Array(3).fill(null).map((_, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index < 2 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200 dark:bg-neutral-700" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <Skeleton className="h-5 w-64" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              data?.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index < data.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200 dark:bg-neutral-700" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full ${getActivityIconBg(activity.type)} flex items-center justify-center ring-8 ring-white dark:ring-neutral-800`}>
                          {getActivityIcon(activity.type)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{activity.description}</p>
                        </div>
                        <div className="text-right text-xs text-neutral-500 dark:text-neutral-400">
                          <time>{formatActivityTime(activity.timestamp)}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'opportunity':
      return <Heart className="h-5 w-5 text-white" />;
    case 'social':
      return <MessageSquare className="h-5 w-5 text-white" />;
    case 'transaction':
      return <CheckCircle className="h-5 w-5 text-white" />;
    default:
      return <Heart className="h-5 w-5 text-white" />;
  }
}

function getActivityIconBg(type: string) {
  switch (type) {
    case 'opportunity':
      return 'bg-primary-500';
    case 'social':
      return 'bg-blue-500';
    case 'transaction':
      return 'bg-green-500';
    default:
      return 'bg-primary-500';
  }
}

function formatActivityTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 1) {
    return 'just now';
  }
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  return date.toLocaleDateString();
}
