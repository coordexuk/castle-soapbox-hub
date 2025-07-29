import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState('Testing connection...');
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('TestConnection: Component mounted, starting connection test...');
    
    const testConnection = async () => {
      try {
        console.log('TestConnection: Testing authentication state...');
        
        // Test authentication state
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        console.log('TestConnection: Auth session:', { session, authError });
        
        if (authError) {
          console.error('TestConnection: Auth error:', authError);
          throw new Error(`Auth error: ${authError.message}`);
        }
        
        const authStatus = session?.user ? 'Connected (Authenticated)' : 'Connected (Not Authenticated)';
        console.log('TestConnection:', authStatus);
        setConnectionStatus(authStatus);
        
        // Test database connection by checking for expected tables
        const expectedTables = ['profiles', 'team_registrations', 'team_members'];
        const foundTables: string[] = [];
        
        console.log('TestConnection: Testing database connection...');
        
        // Check each expected table
        for (const table of expectedTables) {
          console.log(`TestConnection: Checking table: ${table}`);
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            console.log(`TestConnection: Table ${table} check result:`, { data, error });
            
            if (!error) {
              console.log(`TestConnection: Table ${table} is accessible`);
              foundTables.push(table);
            } else {
              console.warn(`TestConnection: Error accessing table ${table}:`, error);
            }
          } catch (tableError) {
            console.error(`TestConnection: Exception when checking table ${table}:`, tableError);
          }
        }
        
        console.log('TestConnection: Found accessible tables:', foundTables);
        
        if (foundTables.length > 0) {
          setTables(foundTables);
        } else {
          const message = 'No accessible tables found';
          console.warn('TestConnection:', message);
          setTables([message]);
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('TestConnection: Connection test failed:', errorMessage, err);
        setError(errorMessage);
        setConnectionStatus(`Error: ${errorMessage}`);
      } finally {
        console.log('TestConnection: Connection test completed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Connection Test</h2>
      <div className="space-y-4">
        <div>
          <p className="font-medium">Status:</p>
          <p className="text-blue-600">{connectionStatus}</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}
        
        <div>
          <p className="font-medium">Public Tables:</p>
          {tables.length > 0 ? (
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {tables.map((table) => (
                <li key={table} className="text-gray-700">{table}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No tables found or error loading tables</p>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> This is a test component to verify the Supabase connection.
            It will list all public tables in your database if the connection is successful.
          </p>
        </div>
      </div>
    </div>
  );
}
