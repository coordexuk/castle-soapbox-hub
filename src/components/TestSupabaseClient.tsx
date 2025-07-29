import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function TestSupabaseClient() {
  const [status, setStatus] = useState('Testing Supabase client...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testClient = async () => {
      try {
        console.log('TestSupabaseClient: Starting test...');
        
        // Test if supabase is defined
        if (!supabase) {
          throw new Error('Supabase client is not defined');
        }
        
        console.log('TestSupabaseClient: Supabase client exists');
        
        // Test auth methods
        if (!supabase.auth) {
          throw new Error('Supabase auth is not available');
        }
        
        console.log('TestSupabaseClient: Auth methods are available');
        
        // Test a simple auth method
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('TestSupabaseClient: Session test result:', { sessionData, sessionError });
        
        if (sessionError) {
          console.warn('TestSupabaseClient: Session error (may be expected if not logged in):', sessionError);
        }
        
        // Test if we can access the database
        try {
          const { data: tables, error: tablesError } = await supabase
            .from('pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');
            
          console.log('TestSupabaseClient: Database tables test result:', { tables, tablesError });
          
          if (tablesError) {
            console.warn('TestSupabaseClient: Could not list tables (may be expected due to permissions):', tablesError);
          }
        } catch (dbError) {
          console.error('TestSupabaseClient: Database test error:', dbError);
        }
        
        setStatus('Supabase client is working correctly');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('TestSupabaseClient: Test failed:', errorMessage, err);
        setError(errorMessage);
        setStatus(`Error: ${errorMessage}`);
      }
    };

    testClient();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Supabase Client Test</h2>
      <div className="space-y-4">
        <div>
          <p className="font-medium">Status:</p>
          <p className={error ? 'text-red-600' : 'text-green-600'}>{status}</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}
        
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Check the browser console for detailed logs.
          </p>
        </div>
      </div>
    </div>
  );
}
