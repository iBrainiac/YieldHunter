import React from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAdmin } from '@/hooks/use-admin';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

const AdminPage: React.FC = () => {
  const { isAdmin, isAdminLoading } = useAdmin();
  const [_, navigate] = useLocation();

  // Show loading state while checking admin status
  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. This area is restricted to the contract owner only.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate('/')} variant="outline">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // If admin, show the dashboard
  return <AdminDashboard />;
};

export default AdminPage;