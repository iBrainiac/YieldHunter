import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/chatbot/chat-interface";
import { AIChatbot } from "@/components/chatbot/ai-chatbot";
import { Bot, Sparkles, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ChatbotPage() {
  const [chatMode, setChatMode] = useState<"original" | "enhanced">("enhanced");
  
  return (
    <div className="container py-8">
      <Helmet>
        <title>AI Assistant | YieldHunter</title>
      </Helmet>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            AI Assistant
            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Sparkles className="w-3 h-3 mr-1" />
              OpenAI Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Chat with our AI to manage your yield farming. Auto-deposit for optimal returns.
          </p>
        </div>
        
        <div className="flex items-center">
          <Button 
            variant={chatMode === "original" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChatMode("original")}
            className="rounded-r-none flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            <span>Standard</span>
          </Button>
          <Button 
            variant={chatMode === "enhanced" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChatMode("enhanced")}
            className="rounded-l-none flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Enhanced GPT</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[70vh]">
          {chatMode === "original" ? (
            <ChatInterface />
          ) : (
            <AIChatbot autoScan={false} />
          )}
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Enhanced AI Features
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">Advanced Analysis</h4>
                <p className="text-muted-foreground">
                  Our enhanced AI can provide in-depth analysis of yield opportunities and personalized recommendations.
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Risk assessment of protocols</li>
                  <li>APY trend predictions</li>
                  <li>Optimal asset allocation strategies</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Smart Portfolio Optimization</h4>
                <p className="text-muted-foreground">
                  Get AI-generated strategies tailored to your risk profile and investment goals.
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Multi-protocol diversification</li>
                  <li>Risk-based asset allocation</li>
                  <li>Automatic rebalancing recommendations</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              How to use the AI Assistant
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>"Analyze the AAVE USDC pool on Base network"</p>
              <p>"Create a yield strategy with $10,000"</p>
              <p>"What are current market trends in DeFi?"</p>
              <p>"Explain impermanent loss to me"</p>
              <p>"What's the safest stablecoin yield right now?"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}