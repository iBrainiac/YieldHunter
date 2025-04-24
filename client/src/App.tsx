import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { WalletProvider } from "@/hooks/use-wallet";
import { AdminProvider } from "@/hooks/use-admin";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Opportunities from "@/pages/opportunities";
import Portfolio from "@/pages/portfolio";
import SocialPosts from "@/pages/social-posts";
import Settings from "@/pages/settings";
import Agents from "@/pages/agents";
import YieldStrategies from "@/pages/strategies";
import Chatbot from "@/pages/chatbot";
import AdminPage from "@/pages/admin";
import TelegramPage from "@/pages/telegram";
import Sidebar from "@/components/layout/sidebar";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";

// Routes that should be accessible without subscription
const publicRoutes = ["/", "/settings", "/admin"];

function Router() {
  // Use wouter's useLocation to get the current path
  const [location] = useLocation();
  
  // Check if current path is in public routes
  const isPublicRoute = publicRoutes.includes(location);
  
  // Create the shared application layout content
  const appContent = (
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
          <Route path="/chatbot" component={Chatbot} />
          <Route path="/telegram" component={TelegramPage} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );

  // For public routes, show content directly
  if (isPublicRoute) {
    return appContent;
  }

  // For protected routes, check subscription status
  return (
    <SubscriptionGate>
      {appContent}
    </SubscriptionGate>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <AdminProvider>
            <Router />
            <Toaster />
          </AdminProvider>
        </WalletProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
