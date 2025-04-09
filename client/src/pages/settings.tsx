import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Loader2, Settings2, Bell, Shield, Key, Activity } from "lucide-react";

interface AgentConfig {
  id: number;
  scanFrequency: string;
  riskTolerance: string;
  networks: string[];
  postingMode: string;
  parallelScanning: boolean;
  maxAgents: number;
  userId: number | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("agent");
  
  return (
    <div>
      <Header title="Settings" />
      
      <div className="p-4 md:p-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid md:w-[500px] grid-cols-4">
            <TabsTrigger value="agent">
              <Settings2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Agent</span>
            </TabsTrigger>
            <TabsTrigger value="account">
              <Key className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <TabsContent value="agent" className="mt-0">
          <AgentSettings />
        </TabsContent>
        
        <TabsContent value="account" className="mt-0">
          <AccountSettings />
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-0">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="security" className="mt-0">
          <SecuritySettings />
        </TabsContent>
      </div>
    </div>
  );
}

function AgentSettings() {
  const [config, setConfig] = useState<AgentConfig>({
    id: 1,
    scanFrequency: "hourly",
    riskTolerance: "low",
    networks: ["ethereum", "polygon", "bsc"],
    postingMode: "approval",
    parallelScanning: false,
    maxAgents: 3,
    userId: null
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery<AgentConfig>({
    queryKey: ["/api/agent-configuration"],
    refetchOnWindowFocus: false,
  });
  
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
      postingMode: config.postingMode,
      parallelScanning: config.parallelScanning,
      maxAgents: config.maxAgents
    });
  };
  
  const handleResetToDefault = () => {
    setConfig({
      id: 1,
      scanFrequency: "hourly",
      riskTolerance: "low",
      networks: ["ethereum", "polygon", "bsc"],
      postingMode: "approval",
      parallelScanning: false,
      maxAgents: 3,
      userId: null
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            AI Agent Configuration
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Configure how your AI yield optimizer operates
          </p>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
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
          )}
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
      
      <Card>
        <CardHeader>
          <h3 className="font-bold">Advanced Settings</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Parallel Scanning</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Enable multiple agents to scan opportunities simultaneously
                </p>
              </div>
              <Switch 
                checked={config.parallelScanning}
                onCheckedChange={(checked) => {
                  setConfig({ ...config, parallelScanning: checked });
                  updateConfigMutation.mutate({ parallelScanning: checked });
                }}
              />
            </div>
            
            {config.parallelScanning && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Max Agents</h4>
                  <span className="text-sm font-semibold">{config.maxAgents}</span>
                </div>
                <div className="px-1">
                  <Slider
                    value={[config.maxAgents]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => {
                      const maxAgents = value[0];
                      setConfig({ ...config, maxAgents });
                      updateConfigMutation.mutate({ maxAgents });
                    }}
                    className="my-4"
                  />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Fewer</span>
                    <span>More</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Auto-compound Yields</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Automatically reinvest earned yields for compound growth
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Slippage Protection</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Cancel transactions with slippage higher than 1%
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Gas Price Optimization</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Wait for optimal gas prices before executing transactions
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountSettings() {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold">Account Information</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value="crypto_yield_hunter" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value="user@example.com" className="mt-1" />
          </div>
        </div>
        
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" value="DeFi enthusiast and yield optimizer" className="mt-1" />
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Connected Accounts</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </div>
                <div>
                  <p className="font-medium">Twitter</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">@yield_hawk_ai</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-600" fill="currentColor"><path d="M8.65,8a.5.5,0,0,0-.5.5v11a.5.5,0,0,0,.5.5h6.69a.51.51,0,0,0,.5-.5V8.5a.51.51,0,0,0-.5-.5Zm0,0" /><path d="M16.99,7.85V7.5a3.5,3.5,0,0,0-7,0v.35a.85.85,0,0,0-.85.85v.87a1.39,1.39,0,0,0,1.39,1.39H16.45a1.39,1.39,0,0,0,1.39-1.39V8.7a.85.85,0,0,0-.85-.85Zm-5.21-.35a1.71,1.71,0,0,1,3.42,0v.35H11.78Zm0,0" /></svg>
                </div>
                <div>
                  <p className="font-medium">Farcaster</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">@yieldhawk</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-neutral-600" fill="currentColor"><path d="M24 12.42l-4.428 4.415H4.428L0 12.42l4.428-4.415h15.144L24 12.42z"/></svg>
                </div>
                <div>
                  <p className="font-medium">Discord</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Not connected</p>
                </div>
              </div>
              <Button size="sm">Connect</Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-3">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}

function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold">Notification Preferences</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Yield Alerts</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p>New high-yield opportunities</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Get notified when the AI finds new opportunities above your threshold</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p>APY changes</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Alert when APY changes by more than 5% on your invested assets</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p>Risk level changes</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Alert when a protocol's risk assessment changes</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Transaction Notifications</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p>Transaction confirmations</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive notifications when transactions are confirmed</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p>Failed transactions</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Get alerts when transactions fail</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Social Media Notifications</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p>Post publishing</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Get notified when posts are published to social media</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p>Engagement updates</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive updates on post engagement (likes, shares, etc.)</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Notification Channels</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="channel-email" defaultChecked />
                <Label htmlFor="channel-email">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="channel-browser" defaultChecked />
                <Label htmlFor="channel-browser">Browser</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="channel-mobile" />
                <Label htmlFor="channel-mobile">Mobile Push</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button>Save Preferences</Button>
      </CardFooter>
    </Card>
  );
}

function SecuritySettings() {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold">Security Settings</h3>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Password</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" className="mt-1" />
            </div>
          </div>
          <Button className="mt-4">Update Password</Button>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <p>Enable 2FA</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Add an extra layer of security to your account</p>
            </div>
            <Switch />
          </div>
          <Button variant="outline" disabled>Set Up 2FA</Button>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Transaction Security</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p>Require confirmation for all transactions</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Always prompt for confirmation before executing any transaction</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p>Set transaction limits</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Limit the maximum amount per transaction</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">API Access</h4>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p>Enable API access</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Allow external applications to access your data via API</p>
              </div>
              <Switch />
            </div>
          </div>
          <Button variant="outline" disabled>Manage API Keys</Button>
        </div>
      </CardContent>
    </Card>
  );
}
