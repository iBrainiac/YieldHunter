import React from "react";
import { Helmet } from "react-helmet";
import ChatInterface from "@/components/chatbot/chat-interface";

export default function ChatbotPage() {
  return (
    <div className="container py-8">
      <Helmet>
        <title>AI Assistant | YieldHunter</title>
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Chat with our AI to manage your yield farming. Auto-deposit for optimal returns.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatInterface />
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <h3 className="text-lg font-semibold mb-2">How to use the AI Assistant</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">Manual Mode</h4>
                <p className="text-muted-foreground">
                  Chat with the AI to get information, view opportunities, and execute transactions.
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Ask to see top opportunities</li>
                  <li>Request to deposit funds: "Deposit 0.5 ETH to Aave"</li>
                  <li>Get help with finding the best yields</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Auto Mode</h4>
                <p className="text-muted-foreground">
                  Let the AI automatically invest based on your preferences. Configure your settings and let it work for you.
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Enable auto mode by saying "enable auto mode"</li>
                  <li>Set your risk tolerance and minimum APY</li>
                  <li>Auto-rebalance to always get the best returns</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Example Commands</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>"Show me the top opportunities"</p>
              <p>"Deposit 0.5 ETH to Compound"</p>
              <p>"Enable auto mode"</p>
              <p>"What's in my portfolio?"</p>
              <p>"What's the best APY right now?"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}