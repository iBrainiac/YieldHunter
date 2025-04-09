import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { WalletProvider } from "@/hooks/use-wallet";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Opportunities from "@/pages/opportunities";
import Portfolio from "@/pages/portfolio";
import SocialPosts from "@/pages/social-posts";
import Settings from "@/pages/settings";
import Agents from "@/pages/agents";
import YieldStrategies from "@/pages/strategies";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/opportunities" component={Opportunities} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/social-posts" component={SocialPosts} />
          <Route path="/agents" component={Agents} />
          <Route path="/strategies" component={YieldStrategies} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <Router />
          <Toaster />
        </WalletProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
