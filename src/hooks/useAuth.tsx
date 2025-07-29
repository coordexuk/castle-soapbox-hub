
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Initializing auth state');
    let isMounted = true;
    
    // Check for existing session
    const checkSession = async () => {
      try {
        console.log('useAuth: Checking for existing session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('useAuth: Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('useAuth: Session check result:', { session });
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('useAuth: User found, fetching profile');
          await fetchProfile(session.user.id);
        } else {
          console.log('useAuth: No user session found');
          setLoading(false);
        }
      } catch (err) {
        console.error('useAuth: Error in checkSession:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('useAuth: Auth state changed', { event, session });
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('useAuth: User authenticated, fetching profile');
          await fetchProfile(session.user.id);
        } else {
          console.log('useAuth: User signed out, clearing profile');
          setProfile(null);
          setLoading(false);
        }
      }
    );
    
    return () => {
      console.log('useAuth: Cleaning up auth listener');
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log(`Fetching profile for user: ${userId}`);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, create one
        console.log('Profile not found, attempting to create one...');
        await createProfile(userId);
      } else {
        console.log('Profile found:', data);
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
      // Re-throw the error to be caught by the caller
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      console.log(`Creating profile for user: ${userId}`);
      const userEmail = user?.email || 'unknown@example.com';
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId, 
            email: userEmail, 
            full_name: null, 
            role: 'user' 
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw new Error(`Failed to create profile: ${error.message}`);
      } else {
        console.log('Profile created successfully:', data);
        setProfile(data as UserProfile);
        return data;
      }
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        error: error instanceof Error ? error : new Error('Failed to sign in') 
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
  }
  const signUp = async (email: string, password: string, fullName: string, isAdmin: boolean = false) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: isAdmin ? 'admin' : 'user',
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        error: error instanceof Error ? error : new Error('Failed to sign out') 
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
