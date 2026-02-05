import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';
import { toast } from 'sonner';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;

      setCustomers(data.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email ?? undefined,
        phone: c.phone ?? undefined,
        billingAddress: c.billing_address ?? undefined,
        shippingAddress: c.shipping_address ?? undefined,
        companyName: c.company_name ?? undefined,
        vatNumber: c.vat_number ?? undefined,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { customers, loading, refetch: fetchCustomers };
}
