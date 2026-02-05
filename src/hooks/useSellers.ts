import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Seller } from '@/types';
import { toast } from 'sonner';

export function useSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('name');

      if (error) throw error;

      setSellers(data.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email ?? undefined,
        phone: s.phone ?? undefined,
        address: s.address ?? undefined,
        companyName: s.company_name ?? undefined,
        vatNumber: s.vat_number ?? undefined,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      })));
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  return { sellers, loading, refetch: fetchSellers };
}
