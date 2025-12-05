import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user';

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching role:', error);
          setRole('user');
        } else {
          setRole(data?.role as AppRole || 'user');
        }
      } catch (error) {
        console.error('Error checking role:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, isAdmin: role === 'admin', loading };
}
