import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/admin/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  console.log('AdminLayout: Rendering');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const isDashboard = location.pathname === '/admin/dashboard';
  
  console.log('AdminLayout: Initial state', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    loading, 
    isCheckingAuth,
    path: location.pathname
  });

  useEffect(() => {
    console.log('AdminLayout: Starting auth check');
    let timeoutId: NodeJS.Timeout;
    
    // Only add delay if we don't have a user yet
    if (!user) {
      console.log('AdminLayout: No user, setting up timeout');
      timeoutId = setTimeout(() => {
        console.log('AdminLayout: Auth check timeout reached');
        setIsCheckingAuth(false);
      }, 1000); // 1 second timeout
    } else {
      console.log('AdminLayout: User exists, skipping timeout');
      setIsCheckingAuth(false);
    }
    
    return () => {
      console.log('AdminLayout: Cleaning up');
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  // Show loading state while checking authentication
  const showLoading = loading || isCheckingAuth;
  console.log('AdminLayout: Show loading?', { showLoading, loading, isCheckingAuth });
  
  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">
            {loading ? 'Checking authentication...' : 'Loading admin panel...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  console.log('AdminLayout: Checking user', { user });
  if (!user) {
    console.log('AdminLayout: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If profile is not loaded yet but we have a user, show loading
  console.log('AdminLayout: Checking profile', { 
    hasUser: !!user, 
    hasProfile: !!profile,
    profile
  });
  
  if (user && !profile) {
    console.log('AdminLayout: User exists but profile is not loaded yet');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading your profile...</p>
          <p className="text-sm text-gray-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not an admin
  console.log('AdminLayout: Checking admin role', { role: profile?.role });
  if (profile?.role !== 'admin') {
    console.log('AdminLayout: User is not an admin, redirecting to home');
    toast.error('You do not have permission to access this page');
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {!isDashboard && (
              <div className="mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
