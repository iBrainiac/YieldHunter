import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import WalletConnector from "@/components/wallet/wallet-connector";
import AdminNavItem from "@/components/admin/AdminNavItem";
import { 
  ChartBarStacked, 
  ListOrdered, 
  Wallet, 
  MessageSquareText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Bot,
  BarChart
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <ChartBarStacked className="h-5 w-5 mr-3" />,
  },
  {
    title: "Opportunities",
    href: "/opportunities",
    icon: <ListOrdered className="h-5 w-5 mr-3" />,
  },
  {
    title: "Portfolio",
    href: "/portfolio",
    icon: <Wallet className="h-5 w-5 mr-3" />,
  },
  {
    title: "Social Posts",
    href: "/social-posts",
    icon: <MessageSquareText className="h-5 w-5 mr-3" />,
  },
  {
    title: "AI Agents",
    href: "/agents",
    icon: <Cpu className="h-5 w-5 mr-3" />,
  },
  {
    title: "Yield Strategies",
    href: "/strategies",
    icon: <BarChart className="h-5 w-5 mr-3" />,
  },
  {
    title: "AI Assistant",
    href: "/chatbot",
    icon: <Bot className="h-5 w-5 mr-3" />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5 mr-3" />,
  },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "w-full md:w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 md:min-h-screen transition-all duration-300",
          mobileOpen ? "fixed inset-y-0 left-0 z-50 w-64" : "hidden md:block",
          collapsed && "md:w-16",
          className
        )}
      >
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className={cn("flex items-center", collapsed && "justify-center w-full")}>
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
              </svg>
            </div>
            {!collapsed && <h1 className="text-lg font-medium ml-2">YieldHunter AI</h1>}
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          <button 
            className="md:hidden text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            onClick={() => setMobileOpen(false)}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
        
        {/* Wallet Section */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <WalletConnector collapsed={collapsed} />
        </div>
        
        {/* Navigation */}
        <nav className="p-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.href} className="nav-item">
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center p-2 rounded-md cursor-pointer",
                      location === item.href
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50"
                    )}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.title}</span>}
                  </div>
                </Link>
              </div>
            ))}
            
            {/* Admin Navigation Item - Only shown to admin users */}
            {!collapsed ? (
              <AdminNavItem />
            ) : (
              <div className="admin-nav-item">
                {/* If collapsed, we still want to render the admin nav item, but with different styling */}
                <div className="hidden">
                  <AdminNavItem />
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Analytics Summary (only show when not collapsed) */}
        {!collapsed && (
          <div className="p-4 mt-4">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Analytics</h3>
            <AnalyticsSummary />
          </div>
        )}
      </aside>

      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed bottom-4 right-4 z-30 p-3 bg-primary-500 text-white rounded-full shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <ChartBarStacked className="h-6 w-6" />
      </button>
    </>
  );
}

function AnalyticsSummary() {
  // This would fetch real data from the API in a production app
  const [data, setData] = useState({
    tvl: '$12,450',
    tvlPercentage: 75,
    weeklyYield: '+$243.50',
    weeklyYieldPercentage: 65
  });

  return (
    <div className="space-y-3">
      <div className="bg-neutral-100 dark:bg-neutral-700/50 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Value Locked</span>
          <span className="text-sm font-medium">{data.tvl}</span>
        </div>
        <div className="mt-1 h-1 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
          <div 
            className="bg-primary-500 h-full" 
            style={{ width: `${data.tvlPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="bg-neutral-100 dark:bg-neutral-700/50 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Weekly Yield</span>
          <span className="text-sm font-medium text-green-500">{data.weeklyYield}</span>
        </div>
        <div className="mt-1 h-1 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
          <div 
            className="bg-green-500 h-full" 
            style={{ width: `${data.weeklyYieldPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
