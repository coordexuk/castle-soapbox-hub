
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Trophy, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      <header className="bg-white shadow-sm border-b border-castle-red/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/Untitled design (1).png" 
                alt="Castle Douglas Soapbox Derby Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-castle-red">Castle Douglas Soapbox Derby</h1>
                <p className="text-sm text-castle-gray">Team Registration Portal 2026</p>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-castle-gray" />
                  <span className="text-sm text-castle-gray">{profile?.full_name || user.email}</span>
                  {profile?.role === 'admin' && (
                    <span className="px-2 py-1 text-xs bg-castle-red/10 text-castle-red rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
                
                {profile?.role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="flex items-center space-x-1 border-castle-red text-castle-red hover:bg-castle-red hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 border-castle-gray text-castle-gray hover:bg-castle-gray hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
