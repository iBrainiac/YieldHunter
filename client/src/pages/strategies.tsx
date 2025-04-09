import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api, protocolsApi, networksApi } from "@/lib/api";
import {
  Trash2,
  Play,
  Pause,
  Plus,
  CheckCircle2,
  XCircle,
  BarChart,
  Settings,
  RefreshCw,
} from "lucide-react";

interface Strategy {
  id: number;
  name: string;
  description: string;
  status: string;
  triggerType: string;
  targetProtocols: number[];
  targetNetworks: number[];
  conditions: any;
  actions: any;
  protocolInfo?: { id: number; name: string }[];
  networkInfo?: { id: number; name: string }[];
  totalExecutions: number;
  totalInvested: number;
  totalReturn: number;
  lastExecutedAt: string | null;
}

interface StrategyExecution {
  id: number;
  strategyId: number;
  status: string;
  executedAt: string;
  transactionHash: string | null;
  gasUsed: number | null;
  gasFee: number | null;
  opportunityId: number | null;
  details: any;
  errorMessage: string | null;
}

interface Protocol {
  id: number;
  name: string;
  logo: string;
}

interface Network {
  id: number;
  name: string;
  shortName: string;
}

export default function YieldStrategiesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("active");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<StrategyExecution | null>(null);
  const [newStrategyData, setNewStrategyData] = useState({
    name: "",
    description: "",
    triggerType: "apy-based",
    targetProtocols: [] as number[],
    targetNetworks: [] as number[],
    conditions: {
      minApy: 10,
      maxRisk: "medium",
      assetTypes: ["USDC", "ETH"]
    },
    actions: {
      depositAmount: "1.0 ETH",
      autoCompound: true,
      rebalancePeriod: "weekly"
    },
    maxGasFee: 50
  });

  // Fetch strategies
  const { data: strategiesData, isLoading: isLoadingStrategies } = useQuery({
    queryKey: ["/api/yield-strategies"],
    queryFn: () => api.yieldStrategy.getAll()
  });

  // Fetch protocols
  const { data: protocols = [] } = useQuery<Protocol[]>({
    queryKey: ["/api/protocols"],
    queryFn: () => protocolsApi.getAll()
  });

  // Fetch networks
  const { data: networks = [] } = useQuery<Network[]>({
    queryKey: ["/api/networks"],
    queryFn: () => networksApi.getAll()
  });

  // Mutations
  const createStrategyMutation = useMutation({
    mutationFn: (data: any) => api.yieldStrategy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yield-strategies"] });
      setCreateDialogOpen(false);
      toast({
        title: "Strategy Created",
        description: "Your yield farming strategy has been created successfully.",
      });
      // Reset form
      setNewStrategyData({
        name: "",
        description: "",
        triggerType: "apy-based",
        targetProtocols: [],
        targetNetworks: [],
        conditions: {
          minApy: 10,
          maxRisk: "medium",
          assetTypes: ["USDC", "ETH"]
        },
        actions: {
          depositAmount: "1.0 ETH",
          autoCompound: true,
          rebalancePeriod: "weekly"
        },
        maxGasFee: 50
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create strategy: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteStrategyMutation = useMutation({
    mutationFn: (id: number) => api.yieldStrategy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yield-strategies"] });
      toast({
        title: "Strategy Deleted",
        description: "The yield farming strategy has been deleted.",
      });
    }
  });

  const executeStrategyMutation = useMutation({
    mutationFn: (id: number) => api.yieldStrategy.execute(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/yield-strategies"] });
      setSelectedExecution(data.execution);
      toast({
        title: "Strategy Executed",
        description: `Execution status: ${data.execution.status}`,
      });
    }
  });

  const updateStrategyStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      api.yieldStrategy.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yield-strategies"] });
      toast({
        title: "Status Updated",
        description: "The strategy status has been updated.",
      });
    }
  });

  const strategies = strategiesData || [];
  const activeStrategies = strategies.filter(s => s.status === "active");
  const pausedStrategies = strategies.filter(s => s.status === "paused");
  
  const handleCreateStrategy = () => {
    createStrategyMutation.mutate(newStrategyData);
  };

  const handleDeleteStrategy = (id: number) => {
    deleteStrategyMutation.mutate(id);
  };

  const handleExecuteStrategy = (id: number) => {
    executeStrategyMutation.mutate(id);
  };

  const handleUpdateStatus = (id: number, status: string) => {
    updateStrategyStatusMutation.mutate({ id, status });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Automated Yield Strategies</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up automated strategies to optimize your yield farming
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Yield Farming Strategy</DialogTitle>
              <DialogDescription>
                Configure your automated yield farming strategy for optimal returns.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newStrategyData.name}
                  onChange={(e) => setNewStrategyData({...newStrategyData, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newStrategyData.description}
                  onChange={(e) => setNewStrategyData({...newStrategyData, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trigger" className="text-right">
                  Trigger Type
                </Label>
                <select
                  id="trigger"
                  value={newStrategyData.triggerType}
                  onChange={(e) => setNewStrategyData({...newStrategyData, triggerType: e.target.value})}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="apy-based">APY Based</option>
                  <option value="time-based">Time Based</option>
                  <option value="gas-based">Gas Price Based</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Target Protocols</Label>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {protocols.map((protocol) => (
                    <Badge
                      key={protocol.id}
                      variant={newStrategyData.targetProtocols.includes(protocol.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (newStrategyData.targetProtocols.includes(protocol.id)) {
                          setNewStrategyData({
                            ...newStrategyData,
                            targetProtocols: newStrategyData.targetProtocols.filter(id => id !== protocol.id)
                          });
                        } else {
                          setNewStrategyData({
                            ...newStrategyData,
                            targetProtocols: [...newStrategyData.targetProtocols, protocol.id]
                          });
                        }
                      }}
                    >
                      {protocol.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Target Networks</Label>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {networks.map((network) => (
                    <Badge
                      key={network.id}
                      variant={newStrategyData.targetNetworks.includes(network.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (newStrategyData.targetNetworks.includes(network.id)) {
                          setNewStrategyData({
                            ...newStrategyData,
                            targetNetworks: newStrategyData.targetNetworks.filter(id => id !== network.id)
                          });
                        } else {
                          setNewStrategyData({
                            ...newStrategyData,
                            targetNetworks: [...newStrategyData.targetNetworks, network.id]
                          });
                        }
                      }}
                    >
                      {network.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minApy" className="text-right">
                  Minimum APY (%)
                </Label>
                <Input
                  id="minApy"
                  type="number"
                  value={newStrategyData.conditions.minApy}
                  onChange={(e) => setNewStrategyData({
                    ...newStrategyData, 
                    conditions: {...newStrategyData.conditions, minApy: parseFloat(e.target.value)}
                  })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxGas" className="text-right">
                  Max Gas Fee (USD)
                </Label>
                <Input
                  id="maxGas"
                  type="number"
                  value={newStrategyData.maxGasFee}
                  onChange={(e) => setNewStrategyData({
                    ...newStrategyData, 
                    maxGasFee: parseFloat(e.target.value)
                  })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Deposit Amount
                </Label>
                <Input
                  id="amount"
                  value={newStrategyData.actions.depositAmount}
                  onChange={(e) => setNewStrategyData({
                    ...newStrategyData, 
                    actions: {...newStrategyData.actions, depositAmount: e.target.value}
                  })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStrategy} disabled={createStrategyMutation.isPending}>
                {createStrategyMutation.isPending ? "Creating..." : "Create Strategy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Strategies ({activeStrategies.length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused Strategies ({pausedStrategies.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activeStrategies.length === 0 ? (
            <div className="text-center p-6 bg-muted rounded-md">
              <p>No active strategies. Create a new strategy to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStrategies.map((strategy) => (
                <StrategyCard 
                  key={strategy.id} 
                  strategy={strategy}
                  onDelete={handleDeleteStrategy}
                  onExecute={handleExecuteStrategy}
                  onUpdateStatus={(id) => handleUpdateStatus(id, "paused")}
                  onSelect={setSelectedStrategy}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="paused" className="space-y-4">
          {pausedStrategies.length === 0 ? (
            <div className="text-center p-6 bg-muted rounded-md">
              <p>No paused strategies.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pausedStrategies.map((strategy) => (
                <StrategyCard 
                  key={strategy.id} 
                  strategy={strategy}
                  onDelete={handleDeleteStrategy}
                  onExecute={handleExecuteStrategy}
                  onUpdateStatus={(id) => handleUpdateStatus(id, "active")}
                  onSelect={setSelectedStrategy}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Strategy Detail Dialog */}
      {selectedStrategy && (
        <Dialog open={!!selectedStrategy} onOpenChange={(open) => !open && setSelectedStrategy(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedStrategy.name}</DialogTitle>
              <DialogDescription>
                {selectedStrategy.description || "No description provided."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge variant={selectedStrategy.status === "active" ? "default" : "secondary"}>
                    {selectedStrategy.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Trigger Type</p>
                  <Badge variant="outline">{selectedStrategy.triggerType}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Total Executions</p>
                  <p>{selectedStrategy.totalExecutions || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Last Executed</p>
                  <p>{selectedStrategy.lastExecutedAt ? new Date(selectedStrategy.lastExecutedAt).toLocaleString() : "Never"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Total Invested</p>
                  <p>{selectedStrategy.totalInvested || 0} ETH</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Total Return</p>
                  <p>{(selectedStrategy.totalReturn || 0).toFixed(6)} ETH</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium mb-2">Target Protocols</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStrategy.protocolInfo?.map((protocol) => (
                    <Badge key={protocol.id} variant="outline">
                      {protocol.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Target Networks</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStrategy.networkInfo?.map((network) => (
                    <Badge key={network.id} variant="outline">
                      {network.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium mb-2">Conditions</p>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selectedStrategy.conditions, null, 2)}</pre>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Actions</p>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selectedStrategy.actions, null, 2)}</pre>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedStrategy(null)}
              >
                Close
              </Button>
              <Button 
                variant={selectedStrategy.status === "active" ? "default" : "secondary"}
                onClick={() => {
                  handleUpdateStatus(
                    selectedStrategy.id, 
                    selectedStrategy.status === "active" ? "paused" : "active"
                  );
                  setSelectedStrategy(null);
                }}
              >
                {selectedStrategy.status === "active" ? (
                  <>
                    <Pause size={16} className="mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-2" />
                    Activate
                  </>
                )}
              </Button>
              <Button 
                onClick={() => {
                  handleExecuteStrategy(selectedStrategy.id);
                  setSelectedStrategy(null);
                }}
                disabled={executeStrategyMutation.isPending}
              >
                <Play size={16} className="mr-2" />
                Execute Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Execution Result Dialog */}
      {selectedExecution && (
        <Dialog open={!!selectedExecution} onOpenChange={(open) => !open && setSelectedExecution(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Execution Result</DialogTitle>
              <DialogDescription>
                Strategy execution details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={selectedExecution.status === "success" ? "default" : "destructive"}>
                    {selectedExecution.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Executed At</p>
                  <p>{new Date(selectedExecution.executedAt).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedExecution.status === "success" ? (
                <>
                  <div>
                    <p className="text-sm font-medium">Transaction Hash</p>
                    <p className="text-xs text-muted-foreground break-all">{selectedExecution.transactionHash}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Gas Used</p>
                      <p>{selectedExecution.gasUsed?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Gas Fee</p>
                      <p>{selectedExecution.gasFee ? `${selectedExecution.gasFee} ETH` : "N/A"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Execution Details</p>
                    {selectedExecution.details && (
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(selectedExecution.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-sm font-medium">Error</p>
                  <p className="text-red-500">{selectedExecution.errorMessage || "Unknown error"}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedExecution(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StrategyCard({ 
  strategy, 
  onDelete, 
  onExecute, 
  onUpdateStatus,
  onSelect
}: { 
  strategy: Strategy, 
  onDelete: (id: number) => void, 
  onExecute: (id: number) => void, 
  onUpdateStatus: (id: number) => void,
  onSelect: (strategy: Strategy) => void
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center cursor-pointer" onClick={() => onSelect(strategy)}>
              {strategy.name}
              <Badge variant="outline" className="ml-2">
                {strategy.triggerType}
              </Badge>
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => onUpdateStatus(strategy.id)}
            >
              {strategy.status === "active" ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this strategy? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(strategy.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {strategy.description || "No description provided."}
        </p>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="font-medium">Protocols:</p>
            <p className="text-muted-foreground line-clamp-1">
              {strategy.protocolInfo?.map(p => p.name).join(", ") || "None"}
            </p>
          </div>
          <div>
            <p className="font-medium">Networks:</p>
            <p className="text-muted-foreground line-clamp-1">
              {strategy.networkInfo?.map(n => n.name).join(", ") || "None"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="font-medium">Executions:</p>
            <p>{strategy.totalExecutions || 0}</p>
          </div>
          <div>
            <p className="font-medium">Last Run:</p>
            <p className="text-muted-foreground">
              {strategy.lastExecutedAt 
                ? new Date(strategy.lastExecutedAt).toLocaleDateString() 
                : "Never"}
            </p>
          </div>
        </div>

        <div className="mt-4 text-xs">
          <p className="font-medium">Performance:</p>
          <div className="flex items-center mt-1">
            <div className="bg-muted h-1.5 rounded-full w-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full" 
                style={{ 
                  width: `${strategy.totalReturn > 0 
                    ? Math.min(100, (strategy.totalReturn / strategy.totalInvested * 100) || 0) 
                    : 0}%` 
                }}
              />
            </div>
            <span className="ml-2">
              {strategy.totalReturn 
                ? `+${strategy.totalReturn.toFixed(4)} ETH` 
                : "0.00 ETH"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          size="sm" 
          className="w-full gap-2" 
          onClick={() => onExecute(strategy.id)}
        >
          <Play size={16} />
          Execute Now
        </Button>
      </CardFooter>
    </Card>
  );
}