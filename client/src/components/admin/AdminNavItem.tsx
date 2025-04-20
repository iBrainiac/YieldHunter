import React from 'react';
import { useAdmin } from '@/hooks/use-admin';
import { useLocation } from 'wouter';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminNavItem: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [location] = useLocation();

  // If user is not an admin, don't render anything
  if (!isAdmin) {
    return null;
  }

  const isActive = location === '/admin';

  return (
    <a
      href="/admin"
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary',
        isActive
          ? 'bg-muted font-medium text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-primary'
      )}
    >
      <ShieldAlert className="h-4 w-4" />
      Admin Dashboard
    </a>
  );
};

export default AdminNavItem;