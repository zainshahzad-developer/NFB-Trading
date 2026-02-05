import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  sellerId?: string;
  accountTitle: string;
  iban?: string;
  swift?: string;
  bankName?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useBankAccounts(sellerId?: string) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBankAccounts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('bank_accounts')
        .select('*')
        .order('is_default', { ascending: false })
        .order('account_title');

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setBankAccounts((data || []).map(acc => ({
        id: acc.id,
        sellerId: acc.seller_id || undefined,
        accountTitle: acc.account_title,
        iban: acc.iban || undefined,
        swift: acc.swift || undefined,
        bankName: acc.bank_name || undefined,
        isDefault: acc.is_default || false,
        createdAt: new Date(acc.created_at),
        updatedAt: new Date(acc.updated_at),
      })));
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  const createBankAccount = async (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          seller_id: account.sellerId || null,
          account_title: account.accountTitle,
          iban: account.iban || null,
          swift: account.swift || null,
          bank_name: account.bankName || null,
          is_default: account.isDefault,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBankAccounts();
      toast.success('Bank account added successfully');
      return data;
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast.error('Failed to add bank account');
      throw error;
    }
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({
          account_title: updates.accountTitle,
          iban: updates.iban || null,
          swift: updates.swift || null,
          bank_name: updates.bankName || null,
          is_default: updates.isDefault,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchBankAccounts();
      toast.success('Bank account updated successfully');
    } catch (error) {
      console.error('Error updating bank account:', error);
      toast.error('Failed to update bank account');
      throw error;
    }
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBankAccounts(prev => prev.filter(acc => acc.id !== id));
      toast.success('Bank account deleted successfully');
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error('Failed to delete bank account');
      throw error;
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  return {
    bankAccounts,
    loading,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    refetch: fetchBankAccounts,
  };
}
