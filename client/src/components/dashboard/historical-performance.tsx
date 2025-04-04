import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoricalDataPoint {
  date: string;
  data: Array<{
    protocol: string;
    apy: number;
  }>;
}

interface HistoricalData {
  period: string;
  bestProtocol: string;
  avgApy: number;
  yieldChange: number;
  agentAccuracy: number;
  timeSeriesData: HistoricalDataPoint[];
}

export default function HistoricalPerformance() {
  const [period, setPeriod] = useState("7days");
  
  const { data, isLoading } = useQuery<HistoricalData>({
    queryKey: ["/api/analytics/historical", { period }],
  });

  // Process data for chart
  const chartData = data?.timeSeriesData.map(point => {
    const result: any = { date: point.date };
    point.data.forEach(d => {
      result[d.protocol] = d.apy;
    });
    return result;
  }) || [];

  // Get unique protocols for chart
  const protocols = data?.timeSeriesData[0]?.data.map(d => d.protocol) || [];

  // Color mapping for chart lines
  const colorMap: Record<string, string> = {
    "Aave v3": "#3B82F6",
    "Compound": "#10B981",
    "PancakeSwap": "#EF4444",
    "Curve Finance": "#8B5CF6",
    "SushiSwap": "#EC4899",
    "Convex Finance": "#F59E0B"
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h3 className="font-bold">Historical Yield Performance</h3>
        <div className="mt-3 md:mt-0">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-64 w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickMargin={10} 
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`} 
                  tick={{ fontSize: 12 }} 
                  width={40} 
                />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(2)}%`, ""]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {protocols.map((protocol, index) => (
                  <Line
                    key={protocol}
                    type="monotone"
                    dataKey={protocol}
                    stroke={colorMap[protocol] || `hsl(${index * 60}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 1 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-neutral-50 dark:bg-neutral-700/20 rounded-md p-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Avg. APY</div>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <div className="text-lg font-medium text-green-500">{data?.avgApy.toFixed(1)}%</div>
            )}
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-700/20 rounded-md p-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Best Protocol</div>
            {isLoading ? (
              <Skeleton className="h-6 w-24 mt-1" />
            ) : (
              <div className="text-lg font-medium">{data?.bestProtocol}</div>
            )}
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-700/20 rounded-md p-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Yield Change</div>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <div className={`text-lg font-medium ${data?.yieldChange && data.yieldChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data?.yieldChange && data.yieldChange > 0 ? '+' : ''}{data?.yieldChange.toFixed(1)}%
              </div>
            )}
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-700/20 rounded-md p-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Agent Accuracy</div>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <div className="text-lg font-medium">{data?.agentAccuracy}%</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
