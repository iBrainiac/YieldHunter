import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Check, Play, RefreshCw, Plus, Trash2 } from "lucide-react";
import { api, protocolsApi, networksApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentInstance {
  id: number;
  name: string;
  status: string;
  assignedProtocol: number | null;
  assignedNetwork: number | null;
  currentTask: string | null;
  lastScanTime: string | null;
  configurationId: number;
  createdAt: string;
  performance: {
    successRate: number;
    opportunitiesFound: number;
    lastFound?: string;
  };
  protocol?: {
    id: number;
    name: string;
  };
  network?: {
    id: number;
    name: string;
  };
}

interface AgentConfiguration {
  id: number;
  scanFrequency: string;
  riskTolerance: string;
  networks: string[];
  postingMode: string;
  parallelScanning: boolean;
  maxAgents: number;
}

export default function AgentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<AgentInstance | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<number | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(null);

  // Fetch agent instances
  const {
    data: agents,
    isLoading: isLoadingAgents,
    error: agentsError,
    refetch: refetchAgents
  } = useQuery({
    queryKey: ["/api/agent-instances"],
    queryFn: () => api.agent.getInstances()
  });

  // Fetch configuration
  const {
    data: config,
    isLoading: isLoadingConfig
  } = useQuery({
    queryKey: ["/api/agent-configuration"],
    queryFn: () => api.agent.getConfig()
  });

  // Fetch protocols for agent creation
  const {
    data: protocols,
    isLoading: isLoadingProtocols
  } = useQuery({
    queryKey: ["/api/protocols"],
    queryFn: () => protocolsApi.getAll()
  });

  // Fetch networks for agent creation
  const {
    data: networks,
    isLoading: isLoadingNetworks
  } = useQuery({
    queryKey: ["/api/networks"],
    queryFn: () => networksApi.getAll()
  });

  // Mutation to start scan
  const startScanMutation = useMutation({
    mutationFn: (agentId: number) => api.agent.startScan(agentId),
    onSuccess: () => {
      toast({
        title: "Scan started",
        description: "The agent has started scanning for opportunities",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent-instances"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start scan. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to create new agent
  const createAgentMutation = useMutation({
    mutationFn: (data: { name: string; assignedProtocol?: number; assignedNetwork?: number; configurationId: number }) => 
      api.agent.createInstance(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New agent created successfully",
      });
      setIsAddDialogOpen(false);
      setNewAgentName("");
      setSelectedProtocol(null);
      setSelectedNetwork(null);
      queryClient.invalidateQueries({ queryKey: ["/api/agent-instances"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to delete agent
  const deleteAgentMutation = useMutation({
    mutationFn: (agentId: number) => api.agent.deleteInstance(agentId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent-instances"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete agent. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleStartScan = (agent: AgentInstance) => {
    startScanMutation.mutate(agent.id);
  };

  const handleCreateAgent = () => {
    if (!newAgentName || !config) return;

    const data: {
      name: string;
      assignedProtocol?: number;
      assignedNetwork?: number;
      configurationId: number;
    } = {
      name: newAgentName,
      configurationId: config.id
    };
    
    if (selectedProtocol !== null) {
      data.assignedProtocol = selectedProtocol;
    }
    
    if (selectedNetwork !== null) {
      data.assignedNetwork = selectedNetwork;
    }
    
    createAgentMutation.mutate(data);
  };

  const handleDeleteAgent = (agent: AgentInstance) => {
    if (confirm(`Are you sure you want to delete the agent "${agent.name}"?`)) {
      deleteAgentMutation.mutate(agent.id);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scanning":
        return "bg-blue-500 hover:bg-blue-600";
      case "idle":
        return "bg-green-500 hover:bg-green-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  if (isLoadingAgents || isLoadingConfig) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">AI Agents</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full mt-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (agentsError) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">AI Agents</h1>
        <Card className="bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle size={20} />
              Error Loading Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was a problem loading the agent instances. Please try refreshing the page.</p>
            <Button onClick={() => refetchAgents()} variant="outline" className="mt-4">
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canAddMoreAgents = config && (agents?.length || 0) < config.maxAgents;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)} 
                  disabled={!canAddMoreAgents}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Agent
                </Button>
              </div>
            </TooltipTrigger>
            {!canAddMoreAgents && (
              <TooltipContent>
                <p>Maximum number of agents reached ({config?.maxAgents})</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {agents && agents.length === 0 ? (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle>No Agents Created</CardTitle>
            <CardDescription>
              Create your first agent to start scanning for yield opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents?.map((agent: AgentInstance) => (
            <Card key={agent.id} className="shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{agent.name}</CardTitle>
                  <Badge className={getStatusBadgeColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
                <CardDescription>
                  {agent.protocol ? agent.protocol.name : "No protocol"} • 
                  {agent.network ? agent.network.name : "No network"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium">Current Task:</span> {agent.currentTask || "None"}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Success Rate:</span> {agent.performance?.successRate || 0}%
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Opportunities Found:</span> {agent.performance?.opportunitiesFound || 0}
                  </div>
                  {agent.lastScanTime && (
                    <div className="text-sm">
                      <span className="font-medium">Last Scan:</span> {new Date(agent.lastScanTime).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleStartScan(agent)}
                    disabled={agent.status === "scanning" || startScanMutation.isPending}
                  >
                    {agent.status === "scanning" ? (
                      <>
                        <RefreshCw size={16} className="mr-1 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Play size={16} className="mr-1" />
                        Start Scan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Agent Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="agent-name" className="text-sm font-medium">
                Agent Name
              </label>
              <input
                id="agent-name"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter agent name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="protocol" className="text-sm font-medium">
                Assigned Protocol
              </label>
              <select
                id="protocol"
                value={selectedProtocol || ""}
                onChange={(e) => setSelectedProtocol(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a protocol</option>
                {protocols?.map((protocol: any) => (
                  <option key={protocol.id} value={protocol.id}>
                    {protocol.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="network" className="text-sm font-medium">
                Assigned Network
              </label>
              <select
                id="network"
                value={selectedNetwork || ""}
                onChange={(e) => setSelectedNetwork(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a network</option>
                {networks?.map((network: any) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAgent} disabled={!newAgentName || createAgentMutation.isPending}>
                {createAgentMutation.isPending ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}