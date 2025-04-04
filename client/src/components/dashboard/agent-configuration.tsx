import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AgentConfig {
  id: number;
  scanFrequency: string;
  riskTolerance: string;
  networks: string[];
  postingMode: string;
  userId: number | null;
}

export default function AgentConfiguration() {
  const [config, setConfig] = useState<AgentConfig>({
    id: 1,
    scanFrequency: "hourly",
    riskTolerance: "low",
    networks: ["ethereum", "polygon", "bsc"],
    postingMode: "approval",
    userId: null
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery<AgentConfig>({
    queryKey: ["/api/agent-configuration"],
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    if (data) {
      setConfig(data);
    }
  }, [data]);
  
  const updateConfigMutation = useMutation({
    mutationFn: async (updatedConfig: Partial<AgentConfig>) => {
      const response = await apiRequest("PUT", "/api/agent-configuration", updatedConfig);
      return response.json();
    },
    onSuccess: (updatedConfig) => {
      setConfig(updatedConfig);
      toast({
        title: "Configuration Updated",
        description: "Your agent configuration has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent-configuration"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleNetworkChange = (network: string, checked: boolean) => {
    const updatedNetworks = checked 
      ? [...config.networks, network]
      : config.networks.filter(n => n !== network);
    
    setConfig({ ...config, networks: updatedNetworks });
  };
  
  const handleSaveConfiguration = () => {
    updateConfigMutation.mutate({
      scanFrequency: config.scanFrequency,
      riskTolerance: config.riskTolerance,
      networks: config.networks,
      postingMode: config.postingMode
    });
  };
  
  const handleResetToDefault = () => {
    setConfig({
      id: 1,
      scanFrequency: "hourly",
      riskTolerance: "low",
      networks: ["ethereum", "polygon", "bsc"],
      postingMode: "approval",
      userId: null
    });
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-bold">Agent Configuration</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Configure how your AI yield optimizer operates</p>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold">Agent Configuration</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Configure how your AI yield optimizer operates</p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scan Frequency */}
          <div>
            <h4 className="text-sm font-medium mb-2">Scan Frequency</h4>
            <RadioGroup
              value={config.scanFrequency}
              onValueChange={(value) => setConfig({ ...config, scanFrequency: value })}
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hourly" id="scan-hourly" />
                  <Label htmlFor="scan-hourly">Hourly (Recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="scan-daily" />
                  <Label htmlFor="scan-daily">Daily</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="scan-weekly" />
                  <Label htmlFor="scan-weekly">Weekly</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Risk Tolerance */}
          <div>
            <h4 className="text-sm font-medium mb-2">Risk Tolerance</h4>
            <RadioGroup
              value={config.riskTolerance}
              onValueChange={(value) => setConfig({ ...config, riskTolerance: value })}
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="risk-low" />
                  <Label htmlFor="risk-low">Low (Only established protocols)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="risk-medium" />
                  <Label htmlFor="risk-medium">Medium (Include newer protocols)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="risk-high" />
                  <Label htmlFor="risk-high">High (Include experimental protocols)</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Supported Networks */}
          <div>
            <h4 className="text-sm font-medium mb-2">Supported Networks</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="network-eth" 
                  checked={config.networks.includes("ethereum")}
                  onCheckedChange={(checked) => handleNetworkChange("ethereum", checked as boolean)}
                />
                <Label htmlFor="network-eth">Ethereum</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="network-polygon" 
                  checked={config.networks.includes("polygon")}
                  onCheckedChange={(checked) => handleNetworkChange("polygon", checked as boolean)}
                />
                <Label htmlFor="network-polygon">Polygon</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="network-bsc" 
                  checked={config.networks.includes("bsc")}
                  onCheckedChange={(checked) => handleNetworkChange("bsc", checked as boolean)}
                />
                <Label htmlFor="network-bsc">BSC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="network-arbitrum" 
                  checked={config.networks.includes("arbitrum")}
                  onCheckedChange={(checked) => handleNetworkChange("arbitrum", checked as boolean)}
                />
                <Label htmlFor="network-arbitrum">Arbitrum</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="network-optimism" 
                  checked={config.networks.includes("optimism")}
                  onCheckedChange={(checked) => handleNetworkChange("optimism", checked as boolean)}
                />
                <Label htmlFor="network-optimism">Optimism</Label>
              </div>
            </div>
          </div>
          
          {/* Posting Configuration */}
          <div>
            <h4 className="text-sm font-medium mb-2">Social Posting</h4>
            <RadioGroup
              value={config.postingMode}
              onValueChange={(value) => setConfig({ ...config, postingMode: value })}
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="post-auto" />
                  <Label htmlFor="post-auto">Automatic (Agent decides when to post)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="approval" id="post-approval" />
                  <Label htmlFor="post-approval">Require approval before posting</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="post-manual" />
                  <Label htmlFor="post-manual">Manual posting only</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-end space-x-3">
        <Button 
          variant="outline" 
          onClick={handleResetToDefault}
        >
          Reset to Default
        </Button>
        <Button 
          onClick={handleSaveConfiguration}
          disabled={updateConfigMutation.isPending}
        >
          {updateConfigMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            "Save Configuration"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
