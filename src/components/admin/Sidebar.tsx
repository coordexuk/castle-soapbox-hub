import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Loader2, 
  Calendar, 
  FileText, 
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { toast } from 'sonner';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Applications', href: '/admin/applications', icon: Users },
  { name: 'Teams', href: '/admin/teams', icon: Users },
  { name: 'Event Day', href: '/admin/event-day', icon: Calendar },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const adminTools = [
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'System Logs', href: '/admin/logs', icon: Activity },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const { error } = await signOut();
      
      if (error) {
        throw error;
      }
      
      toast.success('Successfully signed out');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex flex-col flex-1 mt-5">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href) && item.href !== '/';
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent',
                      'group flex items-center px-3 py-2.5 text-sm font-medium rounded-r-md transition-colors duration-200'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin Tools
                </h3>
                <div className="mt-2 space-y-1">
                  {adminTools.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          isActive
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 flex-shrink-0 h-5 w-5'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>
        </div>
        <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={cn(
              'group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md',
              'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              'transition-colors duration-200',
              isSigningOut ? 'opacity-50 cursor-not-allowed' : ''
            )}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-gray-400" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut
                  className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500 transition-colors duration-200"
                  aria-hidden="true"
                />
                Sign out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
