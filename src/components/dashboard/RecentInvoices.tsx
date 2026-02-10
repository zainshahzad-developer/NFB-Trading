import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText, ArrowUpRight, ArrowDownLeft, ShoppingCart, DollarSign } from 'lucide-react';

const statusStyles = {
  paid: 'bg-success/10 text-success border-success/20',
  sent: 'bg-accent/10 text-accent border-accent/20',
  draft: 'bg-muted text-muted-foreground border-muted',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface RecentInvoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  customer_name: string | null;
  seller_name: string | null;
  invoice_type: 'sales' | 'purchase';
}

export function RecentInvoices() {
  const [invoices, setInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            total,
            status,
            invoice_type,
            customers(name),
            sellers(name, company_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        setInvoices(data?.map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          total: Number(inv.total),
          status: inv.status,
          invoice_type: inv.invoice_type as 'sales' | 'purchase',
          customer_name: inv.customers?.name || null,
          seller_name: inv.sellers?.company_name || inv.sellers?.name || null,
        })) || []);
      } catch (error) {
        console.error('Error fetching recent invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentInvoices();
  }, []);

  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Recent Invoices</h3>
          <p className="text-sm text-muted-foreground">Latest transactions</p>
        </div>
        <a href="/invoices" className="text-sm font-medium text-accent hover:underline">
          View all
        </a>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No invoices yet</p>
          <p className="text-sm text-muted-foreground">Create your first invoice to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const isPurchase = invoice.invoice_type === 'purchase';
            const name = isPurchase ? invoice.seller_name || 'Unknown Seller' : invoice.customer_name || 'Unknown Customer';
            const iconBg = isPurchase ? 'bg-destructive/10' : 'bg-success/10';
            const iconColor = isPurchase ? 'text-destructive' : 'text-success';

            return (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", iconBg)}>
                    {isPurchase ? (
                      <ShoppingCart className={cn("h-5 w-5", iconColor)} />
                    ) : (
                      <DollarSign className={cn("h-5 w-5", iconColor)} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-card-foreground">{name}</p>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        {isPurchase ? 'Purchase' : 'Sale'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-semibold", isPurchase ? "text-destructive" : "text-success")}>
                    {isPurchase ? '-' : '+'}€{invoice.total.toLocaleString()}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn('mt-1 capitalize', statusStyles[invoice.status as keyof typeof statusStyles] || statusStyles.draft)}
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
