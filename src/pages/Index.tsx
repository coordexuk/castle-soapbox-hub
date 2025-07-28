
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { AdminPanel } from '@/components/AdminPanel';
import { useSearchParams } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Layout>
      {isAdmin ? <AdminPanel /> : <Dashboard />}
    </Layout>
  );
};

export default Index;
