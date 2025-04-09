import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizontal, Bot, User, Coins, Sparkles, AlertTriangle, Check } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { protocolsApi, networksApi, api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  content: string;
  timestamp: Date;
  isAction?: boolean;
  actionStatus?: 'pending' | 'success' | 'error';
  actionDetails?: Record<string, any>;
}

interface Protocol {
  id: number;
  name: string;
  logo: string;
  riskLevel: string;
}

interface Opportunity {
  id: number;
  protocolId: number;
  networkId: number;
  asset: string;
  apy: number;
  protocol?: Protocol;
}

export default function ChatInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      content: 'Hello! I\'m your YieldHawk AI assistant. I can help you deposit funds into yield protocols or set up automated deposits. How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoSettings, setAutoSettings] = useState({
    maxAmount: '0.5',
    minApy: 12,
    maxRisk: 'medium',
    autoRebalance: true,
    rebalanceThreshold: 2 // Rebalance if APY difference is greater than 2%
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { walletState, connect } = useWallet();
  
  // Get opportunities
  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities'],
    queryFn: () => api.transaction.getOpportunities()
  });

  // Get protocols
  const { data: protocols = [] } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols'],
    queryFn: () => protocolsApi.getAll()
  });

  // Execute transaction mutation
  const depositMutation = useMutation({
    mutationFn: (params: { opportunityId: number, amount: string }) => 
      api.transaction.execute(params),
    onSuccess: (result, variables) => {
      // Find the relevant opportunity
      const opportunity = opportunities.find(o => o.id === variables.opportunityId);
      const protocol = protocols.find(p => p.id === opportunity?.protocolId);
      
      // Create a success message
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Successfully deposited ${variables.amount} ${opportunity?.asset || 'tokens'} into ${protocol?.name || 'protocol'}.`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'success',
        actionDetails: {
          transactionHash: result.transactionHash,
          amount: variables.amount,
          opportunityId: variables.opportunityId
        }
      });
      
      toast({
        title: "Transaction successful",
        description: `Deposited ${variables.amount} ${opportunity?.asset || 'tokens'} into ${protocol?.name || 'protocol'}.`
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any, variables) => {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Error: ${error.message || 'Failed to execute transaction. Please try again.'}`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'error'
      });
    }
  });
  
  // Withdraw mutation for handling withdrawals
  const withdrawMutation = useMutation({
    mutationFn: (params: { opportunityId: number, amount: string }) => 
      api.transaction.withdraw(params),
    onSuccess: (result, variables) => {
      // Find the relevant opportunity
      const opportunity = opportunities.find(o => o.id === variables.opportunityId);
      const protocol = protocols.find(p => p.id === opportunity?.protocolId);
      
      // Create a success message
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Successfully withdrew ${variables.amount} ${opportunity?.asset || 'tokens'} from ${protocol?.name || 'protocol'}.`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'success',
        actionDetails: {
          transactionHash: result.transactionHash,
          amount: variables.amount,
          opportunityId: variables.opportunityId
        }
      });
      
      toast({
        title: "Withdrawal successful",
        description: `Withdrew ${variables.amount} ${opportunity?.asset || 'tokens'} from ${protocol?.name || 'protocol'}.`
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any, variables) => {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Error: ${error.message || 'Failed to execute withdrawal. Please try again.'}`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'error'
      });
      
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to execute the transaction",
        variant: "destructive"
      });
    }
  });

  // Auto-scrolling
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (message: ChatMessage) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    
    // Process the message
    processUserMessage(input);
    
    // Clear input
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const processUserMessage = (message: string) => {
    const lowerMsg = message.toLowerCase();
    
    // Check if wallet is connected
    if (!walletState?.connected) {
      if (lowerMsg.includes('deposit') || lowerMsg.includes('send') || lowerMsg.includes('invest') || 
          lowerMsg.includes('withdraw') || lowerMsg.includes('balance') || lowerMsg.includes('portfolio')) {
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: 'You need to connect your wallet first. Would you like to connect now?',
          timestamp: new Date()
        });
        return;
      }
    }
    
    // Handle various intents
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg === 'hi' || lowerMsg.includes('hey')) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: 'Hello! I can help you manage your yield farming. You can ask me to deposit funds to specific protocols or enable auto-mode for smart deposits.',
        timestamp: new Date()
      });
    }
    else if (lowerMsg.includes('help') || lowerMsg.includes('what can you do')) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: 'I can help you with:\n- Depositing funds to yield protocols\n- Withdrawing funds from protocols\n- Checking your wallet balance\n- Setting up auto-investments based on your risk preferences\n- Showing current top opportunities\n- Finding protocols across all agents\n- Managing your yield portfolio\n\nJust tell me what you need!',
        timestamp: new Date()
      });
    }
    else if (lowerMsg.includes('connect wallet') || lowerMsg.includes('connect my wallet')) {
      handleConnectWallet();
    }
    else if ((lowerMsg.includes('deposit') || lowerMsg.includes('invest') || lowerMsg.includes('send')) && walletState?.connected) {
      handleDepositIntent(message);
    }
    else if ((lowerMsg.includes('withdraw') || lowerMsg.includes('take out') || lowerMsg.includes('remove')) && walletState?.connected) {
      handleWithdrawIntent(message);
    }
    else if ((lowerMsg.includes('balance') || lowerMsg.includes('portfolio') || lowerMsg.includes('holding') || lowerMsg.includes('asset')) && walletState?.connected) {
      checkWalletBalance();
    }
    else if (lowerMsg.includes('auto') || lowerMsg.includes('automatic')) {
      if (lowerMsg.includes('enable') || lowerMsg.includes('turn on') || lowerMsg.includes('activate')) {
        setIsAutoMode(true);
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: 'Auto mode has been enabled. I\'ll automatically invest based on your settings. You can adjust them in the settings tab.',
          timestamp: new Date()
        });
      } else if (lowerMsg.includes('disable') || lowerMsg.includes('turn off') || lowerMsg.includes('deactivate')) {
        setIsAutoMode(false);
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: 'Auto mode has been disabled. I won\'t make any automatic investments. You can always enable it again later.',
          timestamp: new Date()
        });
      } else {
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: 'In auto mode, I can automatically invest your funds in the best yield opportunities based on your preferences. Would you like to enable auto mode?',
          timestamp: new Date()
        });
      }
    }
    else if (lowerMsg.includes('show opportunities') || lowerMsg.includes('best opportunities') || lowerMsg.includes('top opportunities')) {
      showTopOpportunities();
    }
    else if (lowerMsg.includes('find protocols') || lowerMsg.includes('scan protocols') || lowerMsg.includes('list protocols') || lowerMsg.includes('all protocols')) {
      findProtocolsAcrossAgents();
    }
    else {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: 'I\'m not sure I understand. Try asking for help, depositing funds, or enabling auto mode.',
        timestamp: new Date()
      });
    }
  };

  const handleConnectWallet = async () => {
    if (walletState?.connected) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Your wallet (${walletState.address.substring(0, 6)}...${walletState.address.substring(walletState.address.length - 4)}) is already connected.`,
        timestamp: new Date()
      });
      return;
    }
    
    addMessage({
      id: Date.now().toString(),
      sender: 'bot',
      content: 'Connecting your wallet...',
      timestamp: new Date(),
      isAction: true,
      actionStatus: 'pending'
    });
    
    try {
      const result = await connect();
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Wallet connected successfully! Address: ${result.address.substring(0, 6)}...${result.address.substring(result.address.length - 4)}`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'success'
      });
    } catch (error: any) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Failed to connect wallet: ${error.message || 'Unknown error'}`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'error'
      });
    }
  };

  const handleDepositIntent = (message: string) => {
    // Simple parsing of deposit intent
    const amountMatch = message.match(/\b(\d+(\.\d+)?)\s*(eth|usdc|usdt|dai|wbtc)\b/i);
    const protocolMatch = message.match(/\b(aave|compound|curve|yearn|sushiswap|uniswap)\b/i);
    
    if (amountMatch && protocolMatch) {
      const amount = amountMatch[1];
      const asset = amountMatch[3].toUpperCase();
      const protocolName = protocolMatch[1].charAt(0).toUpperCase() + protocolMatch[1].slice(1);
      
      // Find protocol and relevant opportunity
      const protocol = protocols.find(p => p.name.toLowerCase() === protocolName.toLowerCase());
      
      if (!protocol) {
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: `I couldn't find a protocol named ${protocolName}. Please try again with a different protocol.`,
          timestamp: new Date()
        });
        return;
      }
      
      const opportunity = opportunities.find(o => 
        o.protocolId === protocol.id && 
        o.asset.toLowerCase() === asset.toLowerCase()
      );
      
      if (!opportunity) {
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: `I couldn't find a ${asset} opportunity on ${protocolName}. Would you like to see available opportunities?`,
          timestamp: new Date()
        });
        return;
      }
      
      // Confirm deposit
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `I'll deposit ${amount} ${asset} into ${protocolName} (APY: ${opportunity.apy.toFixed(2)}%). Please confirm this transaction.`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'pending',
        actionDetails: {
          opportunityId: opportunity.id,
          amount: amount,
          asset: asset,
          protocol: protocolName
        }
      });
      
      // Execute transaction
      depositMutation.mutate({
        opportunityId: opportunity.id,
        amount: amount
      });
      
    } else {
      // Show opportunities since we couldn't parse a specific deposit intent
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `I wasn't able to determine exactly what you want to deposit. Here are some top opportunities:`,
        timestamp: new Date()
      });
      
      showTopOpportunities();
    }
  };

  const showTopOpportunities = () => {
    // Sort by APY descending
    const topOpps = [...opportunities]
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 3);
    
    if (topOpps.length === 0) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `I couldn't find any opportunities right now. Please try again later.`,
        timestamp: new Date()
      });
      return;
    }
    
    // Format opportunity list
    const formattedList = topOpps.map(opp => {
      const protocol = protocols.find(p => p.id === opp.protocolId);
      return `- ${protocol?.name || 'Unknown'}: ${opp.apy.toFixed(2)}% APY for ${opp.asset}`;
    }).join('\n');
    
    addMessage({
      id: Date.now().toString(),
      sender: 'bot',
      content: `Here are the top opportunities right now:\n\n${formattedList}\n\nWould you like to deposit to any of these?`,
      timestamp: new Date()
    });
  };
  
  const findProtocolsAcrossAgents = async () => {
    addMessage({
      id: Date.now().toString(),
      sender: 'bot',
      content: 'Scanning for protocols across all agent instances...',
      timestamp: new Date(),
      isAction: true,
      actionStatus: 'pending'
    });
    
    try {
      // Get all agent instances
      const instances = await api.agent.getInstances();
      
      if (!instances || instances.length === 0) {
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: 'There are no active agent instances to scan. Would you like to create one?',
          timestamp: new Date(),
          isAction: true,
          actionStatus: 'error'
        });
        return;
      }
      
      // Get all protocols
      const discoveredProtocols = protocols.map(p => {
        const agent = instances.find(i => i.assignedProtocol === p.id);
        return {
          ...p,
          scannedBy: agent ? agent.name : 'No specific agent'
        };
      });
      
      // Format protocol list
      const formattedList = discoveredProtocols.map(p => {
        return `- ${p.name} (Risk: ${p.riskLevel.charAt(0).toUpperCase() + p.riskLevel.slice(1)}) - Monitored by: ${p.scannedBy}`;
      }).join('\n');
      
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Found ${discoveredProtocols.length} protocols across ${instances.length} agent instances:\n\n${formattedList}\n\nWould you like to view opportunities in any of these protocols?`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'success'
      });
    } catch (error: any) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Error scanning protocols: ${error.message || 'Unknown error'}`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'error'
      });
    }
  };
  
  const handleWithdrawIntent = (message: string) => {
    // Simple parsing of withdrawal intent
    const amountMatch = message.match(/\b(\d+(\.\d+)?)\s*(eth|usdc|usdt|dai|wbtc)\b/i);
    const protocolMatch = message.match(/\b(aave|compound|curve|yearn|sushiswap|uniswap)\b/i);
    
    if (amountMatch && protocolMatch) {
      const amount = amountMatch[1];
      const asset = amountMatch[3].toUpperCase();
      const protocolName = protocolMatch[1].charAt(0).toUpperCase() + protocolMatch[1].slice(1);
      
      // Find protocol and relevant opportunity
      const protocol = protocols.find(p => p.name.toLowerCase() === protocolName.toLowerCase());
      
      if (!protocol) {
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: `I couldn't find a protocol named ${protocolName}. Please try again with a different protocol.`,
          timestamp: new Date()
        });
        return;
      }
      
      const opportunity = opportunities.find(o => 
        o.protocolId === protocol.id && 
        o.asset.toLowerCase() === asset.toLowerCase()
      );
      
      if (!opportunity) {
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          content: `I couldn't find a ${asset} position on ${protocolName}. Do you have funds deposited there?`,
          timestamp: new Date()
        });
        return;
      }
      
      // Confirm withdrawal
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `I'll withdraw ${amount} ${asset} from ${protocolName}. Please confirm this transaction.`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'pending',
        actionDetails: {
          opportunityId: opportunity.id,
          amount: amount,
          asset: asset,
          protocol: protocolName
        }
      });
      
      // Execute withdrawal transaction
      withdrawMutation.mutate({
        opportunityId: opportunity.id,
        amount: amount
      });
      
    } else {
      // Couldn't parse specific withdrawal intent
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `I wasn't able to determine what you want to withdraw. Please specify the amount, asset, and protocol. For example, "withdraw 0.5 ETH from Aave".`,
        timestamp: new Date()
      });
    }
  };
  
  const checkWalletBalance = async () => {
    if (!walletState?.connected) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `You need to connect your wallet first. Would you like to connect now?`,
        timestamp: new Date()
      });
      return;
    }
    
    addMessage({
      id: Date.now().toString(),
      sender: 'bot',
      content: `Checking your wallet balance...`,
      timestamp: new Date(),
      isAction: true,
      actionStatus: 'pending'
    });
    
    try {
      const balanceInfo = await api.transaction.getWalletBalance();
      
      // Format the balance information
      const tokenList = balanceInfo.tokens.map(token => 
        `- ${token.symbol}: ${token.balance}`
      ).join('\n');
      
      const formattedMessage = `
Wallet Balance:
- Native: ${balanceInfo.native}
${tokenList.length > 0 ? '\nToken Balances:\n' + tokenList : ''}

Total Value: ${balanceInfo.totalValue}

Would you like to deposit or withdraw any assets?`;
      
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: formattedMessage,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'success',
        actionDetails: {
          balanceInfo
        }
      });
    } catch (error: any) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Failed to retrieve wallet balance: ${error.message || 'Unknown error'}`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'error'
      });
    }
  };

  const executeAutomaticDeposit = () => {
    if (!isAutoMode || !walletState?.connected) return;
    
    // Filter opportunities by minimum APY and risk level
    const riskLevels: {[key: string]: number} = {
      low: 1,
      medium: 2,
      high: 3
    };
    
    const maxRiskLevel = riskLevels[autoSettings.maxRisk];
    
    const eligibleOpportunities = opportunities
      .filter(opp => {
        const protocol = protocols.find(p => p.id === opp.protocolId);
        const protocolRiskLevel = protocol?.riskLevel === 'low' ? 1 : 
                                protocol?.riskLevel === 'medium' ? 2 : 3;
        
        return opp.apy >= autoSettings.minApy && 
               protocolRiskLevel <= maxRiskLevel;
      })
      .sort((a, b) => b.apy - a.apy);
    
    if (eligibleOpportunities.length === 0) {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        content: `Auto-deposit: I couldn't find any opportunities matching your criteria (Min APY: ${autoSettings.minApy}%, Max Risk: ${autoSettings.maxRisk}).`,
        timestamp: new Date(),
        isAction: true,
        actionStatus: 'error'
      });
      return;
    }
    
    const bestOpportunity = eligibleOpportunities[0];
    const protocol = protocols.find(p => p.id === bestOpportunity.protocolId);
    
    // Execute transaction
    addMessage({
      id: Date.now().toString(),
      sender: 'bot',
      content: `Auto-deposit: I'm depositing ${autoSettings.maxAmount} ${bestOpportunity.asset} into ${protocol?.name || 'Unknown'} (APY: ${bestOpportunity.apy.toFixed(2)}%).`,
      timestamp: new Date(),
      isAction: true,
      actionStatus: 'pending',
      actionDetails: {
        opportunityId: bestOpportunity.id,
        amount: autoSettings.maxAmount,
        asset: bestOpportunity.asset,
        protocol: protocol?.name
      }
    });
    
    // Execute transaction
    depositMutation.mutate({
      opportunityId: bestOpportunity.id,
      amount: autoSettings.maxAmount
    });
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Tabs defaultValue="chat" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="chat" className="mt-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="flex items-center text-lg font-medium">
              <Bot className="mr-2 h-5 w-5 text-primary" />
              YieldHawk AI Assistant
              {isAutoMode && (
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Auto Mode
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="flex flex-col space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <Avatar className={`h-8 w-8 ${message.sender === 'user' ? 'ml-2' : 'mr-2'}`}>
                        <AvatarFallback>
                          {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div 
                          className={`rounded-lg p-3 ${
                            message.sender === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : message.isAction 
                                ? 'bg-muted' 
                                : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {message.isAction && message.actionStatus === 'pending' && (
                            <div className="mt-2 flex items-center text-xs text-muted-foreground">
                              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mr-1"></div>
                              Processing...
                            </div>
                          )}
                          
                          {message.isAction && message.actionStatus === 'success' && message.actionDetails?.transactionHash && (
                            <div className="mt-2 flex items-center text-xs">
                              <Check className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-green-600 dark:text-green-400">
                                TX: {message.actionDetails.transactionHash.substring(0, 6)}...{message.actionDetails.transactionHash.substring(message.actionDetails.transactionHash.length - 4)}
                              </span>
                            </div>
                          )}
                          
                          {message.isAction && message.actionStatus === 'error' && (
                            <div className="mt-2 flex items-center text-xs">
                              <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                              <span className="text-red-600 dark:text-red-400">Failed</span>
                            </div>
                          )}
                        </div>
                        <div className={`text-xs text-muted-foreground mt-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex gap-2 p-4 pt-0">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button size="icon" onClick={handleSendMessage}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="settings">
        <Card className="border-0 shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg font-medium">Bot Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-mode">Automatic Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Let the bot automatically deposit to best protocols
                </p>
              </div>
              <Switch
                id="auto-mode"
                checked={isAutoMode}
                onCheckedChange={setIsAutoMode}
              />
            </div>
            
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium">Auto Mode Settings</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="max-amount">Maximum deposit amount (ETH)</Label>
                <Input
                  id="max-amount"
                  type="number"
                  step="0.1"
                  value={autoSettings.maxAmount}
                  onChange={(e) => setAutoSettings({...autoSettings, maxAmount: e.target.value})}
                  disabled={!isAutoMode}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="min-apy">Minimum APY (%)</Label>
                <Input
                  id="min-apy"
                  type="number"
                  value={autoSettings.minApy}
                  onChange={(e) => setAutoSettings({...autoSettings, minApy: parseFloat(e.target.value)})}
                  disabled={!isAutoMode}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="max-risk">Maximum Risk Level</Label>
                <select
                  id="max-risk"
                  value={autoSettings.maxRisk}
                  onChange={(e) => setAutoSettings({...autoSettings, maxRisk: e.target.value as any})}
                  disabled={!isAutoMode}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="auto-rebalance"
                  checked={autoSettings.autoRebalance}
                  onCheckedChange={(checked) => setAutoSettings({...autoSettings, autoRebalance: checked})}
                  disabled={!isAutoMode}
                />
                <Label htmlFor="auto-rebalance">Auto-rebalance if better opportunities appear</Label>
              </div>
              
              {isAutoMode && autoSettings.autoRebalance && (
                <div className="grid gap-2">
                  <Label htmlFor="rebalance-threshold">
                    Rebalance if APY difference is greater than (%)
                  </Label>
                  <Input
                    id="rebalance-threshold"
                    type="number"
                    value={autoSettings.rebalanceThreshold}
                    onChange={(e) => setAutoSettings({...autoSettings, rebalanceThreshold: parseFloat(e.target.value)})}
                    disabled={!isAutoMode || !autoSettings.autoRebalance}
                  />
                </div>
              )}
            </div>
            
            {isAutoMode && (
              <div className="pt-4">
                <Button onClick={executeAutomaticDeposit} className="w-full">
                  <Coins className="mr-2 h-4 w-4" />
                  Execute Auto Deposit Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}