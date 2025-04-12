import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

type AIChatbotProps = {
  initialMessages?: ChatMessage[];
  autoScan?: boolean;
};

export function AIChatbot({ initialMessages = [], autoScan = false }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [wsConnection, setWsConnection] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Connect to WebSocket
  useEffect(() => {
    const ws = api.ws.connect();
    
    ws.onOpen(() => {
      console.log('WebSocket connection established');
      setWsConnection(ws);
      
      if (autoScan) {
        // Trigger an auto-scan when connecting if enabled
        setTimeout(() => {
          ws.send({
            type: 'scan_request',
            timestamp: new Date().toISOString()
          });
        }, 1000);
      }
    });
    
    ws.onMessage((data) => {
      if (data.type === 'scan_started') {
        setMessages(prev => [...prev, {
          role: 'system',
          content: '🔍 Starting scan for yield opportunities...',
          timestamp: data.timestamp
        }]);
      } else if (data.type === 'scan_result') {
        const opportunities = data.data.opportunities;
        
        // Create a formatted message with the results
        let content = '✅ Scan complete! Here are the top yield opportunities I found:\n\n';
        
        opportunities.forEach((opp: any, index: number) => {
          content += `${index + 1}. **${opp.protocol}** - ${opp.asset}: ${opp.apy}% APY on ${opp.network} network\n`;
        });
        
        content += '\nWould you like me to analyze any of these opportunities in detail?';
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content,
          timestamp: data.timestamp
        }]);
      } else if (data.type === 'chatbot_response') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.response,
          timestamp: data.data.timestamp
        }]);
        setIsLoading(false);
      } else if (data.type === 'error') {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    });
    
    ws.onClose(() => {
      console.log('WebSocket connection closed');
      setWsConnection(null);
    });
    
    ws.onError((error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the server. Please try again later.',
        variant: 'destructive'
      });
    });
    
    return () => {
      ws.close();
    };
  }, [autoScan, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputValue('');
    
    try {
      // If using WebSocket
      if (wsConnection && wsConnection.socket.readyState === WebSocket.OPEN) {
        wsConnection.send({
          type: 'chatbot_message',
          content: userMessage.content,
          history: messages.filter(m => m.role !== 'system'), // Filter out system messages
          timestamp: new Date().toISOString()
        });
      } else {
        // Fallback to HTTP API if WebSocket is not available
        const history = messages
          .filter(m => m.role !== 'system') // Filter out system messages
          .map(m => ({ role: m.role, content: m.content }));
        
        const response = await api.ai.sendChatMessage(userMessage.content, history);
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        }]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleAnalyzeOpportunity = async (protocolName: string, asset: string, apy: number) => {
    setIsLoading(true);
    try {
      const analysis = await api.ai.analyzeOpportunity({
        protocolName,
        asset,
        apy,
        riskLevel: 'Medium', // Default value, could be extracted from the opportunity
        networkName: 'Base' // Default to Base network
      });
      
      // Format the response
      const content = `## Analysis of ${protocolName} - ${asset} (${apy}% APY)

**Summary**: ${analysis.analysis}

**Risk Assessment**: ${analysis.riskAssessment}

**Recommendation Score**: ${analysis.recommendationScore}/10

**Potential Issues**:
${analysis.potentialIssues.map(issue => `- ${issue}`).join('\n')}

Would you like me to help you invest in this opportunity?`;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error analyzing opportunity:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to analyze the opportunity. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStrategy = async () => {
    setIsLoading(true);
    try {
      const strategy = await api.ai.generateStrategy({
        riskProfile: 'Moderate',
        assets: ['USDC', 'ETH', 'USDT', 'DAI'],
        networks: ['Base', 'Optimism', 'Arbitrum'],
        investmentAmount: 10000
      });
      
      // Format the response
      const content = `## Recommended Yield Strategy

**Description**: ${strategy.strategyDescription}

**Expected Annual Return**: ${strategy.expectedReturns}%

**Recommended Protocols**: ${strategy.recommendedProtocols.join(', ')}

**Asset Allocation**:
${Object.entries(strategy.assetAllocation).map(([asset, percentage]) => `- ${asset}: ${percentage}%`).join('\n')}

**Rebalancing Frequency**: ${strategy.rebalancingFrequency}

Would you like me to help execute this strategy?`;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: 'Strategy Error',
        description: 'Failed to generate a strategy. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown parser (very basic implementation)
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\n\n/g, '<br/><br/>') // Paragraphs
      .replace(/\n/g, '<br/>') // Line breaks
      .replace(/## (.*?)($|\n)/g, '<h3>$1</h3>') // H3 headings
      .replace(/- (.*?)($|\n)/g, '• $1<br/>'); // List items
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span>YieldHunter AI Assistant</span>
            <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Sparkles className="w-3 h-3 mr-1" />
              OpenAI Powered
            </Badge>
          </CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden pt-2">
        <div className="h-full overflow-y-auto pr-1">
          <TabsContent value="chat" className="h-full flex flex-col space-y-4 mt-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Welcome to YieldHunter AI</h3>
                <p className="max-w-md">
                  I'm your personal DeFi assistant. Ask me about yield opportunities, strategies, or market analysis.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[85%]`}>
                    <Avatar className={`${message.role === 'user' ? 'bg-primary' : message.role === 'system' ? 'bg-muted' : 'bg-blue-500'}`}>
                      {message.role === 'user' ? (
                        <User className="text-primary-foreground w-5 h-5" />
                      ) : message.role === 'system' ? (
                        <AlertCircle className="text-muted-foreground w-5 h-5" />
                      ) : (
                        <Bot className="text-primary-foreground w-5 h-5" />
                      )}
                      <AvatarFallback>
                        {message.role === 'user' ? 'U' : message.role === 'system' ? 'S' : 'AI'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg px-4 py-2 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : message.role === 'system'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-secondary'
                    }`}>
                      <div 
                        className="whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />
                      {message.timestamp && (
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex flex-row items-start gap-2 max-w-[85%]">
                  <Avatar className="bg-blue-500">
                    <Bot className="text-primary-foreground w-5 h-5" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-4 py-2 bg-secondary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </TabsContent>
          
          <TabsContent value="actions" className="h-full space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => {
                if (wsConnection) {
                  wsConnection.send({
                    type: 'scan_request',
                    timestamp: new Date().toISOString()
                  });
                  setActiveTab('chat');
                  setMessages(prev => [...prev, {
                    role: 'system',
                    content: '🔍 Starting scan for yield opportunities...',
                    timestamp: new Date().toISOString()
                  }]);
                }
              }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Scan for Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">Find the best yield opportunities across multiple protocols</p>
                </CardContent>
              </Card>
              
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer" onClick={handleGenerateStrategy}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Generate Strategy</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">Create an AI-optimized yield farming strategy</p>
                </CardContent>
              </Card>
              
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => {
                setActiveTab('chat');
                setMessages(prev => [...prev, {
                  role: 'user',
                  content: 'Analyze the current market trends in DeFi',
                  timestamp: new Date().toISOString()
                }]);
                handleSendMessage();
              }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Market Analysis</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">Get insights on current DeFi market conditions</p>
                </CardContent>
              </Card>
              
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => {
                setActiveTab('chat');
                setMessages(prev => [...prev, {
                  role: 'user',
                  content: 'Explain impermanent loss in liquidity pools',
                  timestamp: new Date().toISOString()
                }]);
                handleSendMessage();
              }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">DeFi Education</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">Learn about DeFi concepts and strategies</p>
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Quick Prompts</h3>
              <div className="space-y-2">
                {[
                  "What's the difference between APY and APR?",
                  "How can I minimize impermanent loss?",
                  "Explain how to use Base for yield farming",
                  "What are the risks of yield farming?",
                  "Compare staking vs. liquidity providing"
                ].map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="mr-2 mb-2"
                    onClick={() => {
                      setActiveTab('chat');
                      setInputValue(prompt);
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}