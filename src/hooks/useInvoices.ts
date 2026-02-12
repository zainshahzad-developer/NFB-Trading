import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem } from '@/types';
import { toast } from 'sonner';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch invoices with related data
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          sellers (*),
          customers (*),
          bank_accounts (*)
        `)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch invoice items for each invoice
      const invoicesWithItems: Invoice[] = await Promise.all(
        (invoicesData || []).map(async (inv) => {
          const { data: itemsData } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', inv.id);

          const items: InvoiceItem[] = (itemsData || []).map(item => ({
            id: item.id,
            productId: item.product_id || '',
            productName: item.product_name,
            specs: item.specs || '',
            color: item.color || '',
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            lineTotal: Number(item.line_total),
            buyingRate: item.buying_rate ? Number(item.buying_rate) : undefined,
            // TODO: Uncomment after migration
            // buyingCurrency: item.buying_currency || undefined,
            // exchangeRate: item.exchange_rate ? Number(item.exchange_rate) : undefined,
            // buyingPriceOriginal: item.buying_price_original ? Number(item.buying_price_original) : undefined,
          }));

          return {
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            invoiceType: (inv.invoice_type as 'sales' | 'purchase') || 'sales',
            template: inv.template as Invoice['template'],
            sellerId: inv.seller_id || undefined,
            seller: inv.sellers ? {
              id: inv.sellers.id,
              name: inv.sellers.name,
              email: inv.sellers.email || undefined,
              phone: inv.sellers.phone || undefined,
              address: inv.sellers.address || undefined,
              companyName: inv.sellers.company_name || undefined,
              vatNumber: inv.sellers.vat_number || undefined,
              createdAt: new Date(inv.sellers.created_at),
              updatedAt: new Date(inv.sellers.updated_at),
            } : undefined,
            customerId: inv.customer_id || undefined,
            customer: inv.customers ? {
              id: inv.customers.id,
              name: inv.customers.name,
              email: inv.customers.email || undefined,
              phone: inv.customers.phone || undefined,
              billingAddress: inv.customers.billing_address || undefined,
              shippingAddress: inv.customers.shipping_address || undefined,
              companyName: inv.customers.company_name || undefined,
              vatNumber: inv.customers.vat_number || undefined,
              createdAt: new Date(inv.customers.created_at),
              updatedAt: new Date(inv.customers.updated_at),
            } : undefined,
            bankAccountId: inv.bank_account_id || undefined,
            bankAccount: inv.bank_accounts ? {
              id: inv.bank_accounts.id,
              sellerId: inv.bank_accounts.seller_id || undefined,
              accountTitle: inv.bank_accounts.account_title,
              iban: inv.bank_accounts.iban || undefined,
              swift: inv.bank_accounts.swift || undefined,
              bankName: inv.bank_accounts.bank_name || undefined,
              isDefault: inv.bank_accounts.is_default || false,
              createdAt: new Date(inv.bank_accounts.created_at),
              updatedAt: new Date(inv.bank_accounts.updated_at),
            } : undefined,
            billingAddress: inv.billing_address || undefined,
            shippingAddress: inv.shipping_address || undefined,
            items,
            subtotal: Number(inv.subtotal),
            tax: Number(inv.tax),
            discount: Number(inv.discount || 0),
            shipping: Number(inv.shipping),
            total: Number(inv.total),
            status: inv.status as 'draft' | 'sent' | 'paid' | 'overdue',
            dueDate: new Date(inv.due_date || Date.now()),
            createdAt: new Date(inv.created_at),
            paidAt: inv.paid_at ? new Date(inv.paid_at) : undefined,
          };
        })
      );

      setInvoices(invoicesWithItems);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = async (
    invoice: Omit<Invoice, 'id' | 'createdAt'>,
    adjustStockFn: (productId: string, quantity: number) => Promise<void>
  ) => {
    try {
      // First, validate stock for all items
      // Stock validation should be done before calling this function

      // Insert invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoice.invoiceNumber,
          invoice_type: invoice.invoiceType,
          template: invoice.template,
          seller_id: invoice.sellerId || null,
          customer_id: invoice.customerId || null,
          bank_account_id: invoice.bankAccountId || null,
          billing_address: invoice.billingAddress || null,
          shipping_address: invoice.shippingAddress || null,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          discount: invoice.discount || 0,
          shipping: invoice.shipping,
          total: invoice.total,
          status: invoice.status,
          due_date: invoice.dueDate.toISOString(),
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      const itemsToInsert = invoice.items.map(item => {
        const baseItem: Record<string, unknown> = {
          invoice_id: invoiceData.id,
          product_id: item.productId || null,
          product_name: item.productName,
          specs: item.specs || null,
          color: item.color || null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
        };

        // TODO: Re-enable these fields once the database migration is applied
        // The following columns need to exist in invoice_items table:
        // - buying_currency (text)
        // - exchange_rate (numeric)
        // - buying_price_original (numeric)
        // - buying_rate (numeric) - this one already exists
        //
        // Uncomment the following lines after running the migration:
        // if (item.buyingRate !== undefined && item.buyingRate !== null) {
        //   baseItem.buying_rate = item.buyingRate;
        // }
        // if (item.buyingCurrency) {
        //   baseItem.buying_currency = item.buyingCurrency;
        // }
        // if (item.exchangeRate !== undefined && item.exchangeRate !== null) {
        //   baseItem.exchange_rate = item.exchangeRate;
        // }
        // if (item.buyingPriceOriginal !== undefined && item.buyingPriceOriginal !== null) {
        //   baseItem.buying_price_original = item.buyingPriceOriginal;
        // }

        return baseItem;
      });

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert as any);

      if (itemsError) throw itemsError;

      // Adjust stock for each item based on invoice type
      // Sales invoice: deduct stock (negative)
      // Purchase invoice: add stock (positive)
      for (const item of invoice.items) {
        if (item.productId) {
          const stockChange = invoice.invoiceType === 'purchase' ? item.quantity : -item.quantity;
          await adjustStockFn(item.productId, stockChange);
        }
      }

      // Refresh invoices list
      await fetchInvoices();

      toast.success(`${invoice.invoiceType === 'purchase' ? 'Purchase' : 'Sales'} invoice created successfully`);
      return invoiceData;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
      throw error;
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      const updates: Record<string, unknown> = { status };
      if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.map(inv =>
        inv.id === id
          ? { ...inv, status, paidAt: status === 'paid' ? new Date() : inv.paidAt }
          : inv
      ));

      toast.success('Invoice status updated');
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
      throw error;
    }
  };

  const updateInvoice = async (
    id: string,
    updates: Partial<Omit<Invoice, 'id' | 'createdAt'>>,
    stockAdjustments: { productId: string; quantityChange: number }[],
    adjustStock: (productId: string, quantityChange: number) => Promise<void>
  ) => {
    try {
      // Update invoice record
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          invoice_number: updates.invoiceNumber,
          invoice_type: updates.invoiceType,
          template: updates.template,
          seller_id: updates.sellerId || null,
          customer_id: updates.customerId || null,
          bank_account_id: updates.bankAccountId || null,
          billing_address: updates.billingAddress || null,
          shipping_address: updates.shippingAddress || null,
          subtotal: updates.subtotal,
          tax: updates.tax,
          discount: updates.discount || 0,
          shipping: updates.shipping,
          total: updates.total,
        })
        .eq('id', id);

      if (invoiceError) throw invoiceError;

      // Delete existing invoice items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteError) throw deleteError;

      // Insert new invoice items
      if (updates.items && updates.items.length > 0) {
        const itemsToInsert = updates.items.map(item => {
          const baseItem: Record<string, unknown> = {
            invoice_id: id,
            product_id: item.productId || null,
            product_name: item.productName,
            specs: item.specs || null,
            color: item.color || null,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            line_total: item.lineTotal,
          };

          // TODO: Re-enable currency fields after database migration
          // (Same as in createInvoice function)

          return baseItem;
        });

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert as any);

        if (itemsError) throw itemsError;
      }

      // Apply stock adjustments
      for (const adjustment of stockAdjustments) {
        await adjustStock(adjustment.productId, adjustment.quantityChange);
      }

      // Refresh invoices list
      await fetchInvoices();

      toast.success('Invoice updated successfully');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
      throw error;
    }
  };

  const deleteInvoice = async (
    id: string,
    restoreStock?: (productId: string, quantity: number) => Promise<void>
  ) => {
    try {
      // Get invoice items first to restore stock
      const invoice = invoices.find(inv => inv.id === id);

      // Delete invoice items first
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      // Delete invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Restore stock for each item if function provided
      if (restoreStock && invoice?.items) {
        for (const item of invoice.items) {
          if (item.productId) {
            await restoreStock(item.productId, item.quantity);
          }
        }
      }

      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast.success('Invoice deleted and stock restored');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
      throw error;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    refetch: fetchInvoices,
  };
}
