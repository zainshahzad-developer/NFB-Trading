import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { Package, AlertTriangle, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Index() {
  const { products, loading } = useProducts();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [todayPurchases, setTodayPurchases] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const lowStockItems = products.filter(p => p.quantity <= p.minStock).length;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all invoices (sales and purchase)
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('total, created_at, invoice_type')
          .in('invoice_type', ['sales', 'purchase']);

        if (error) throw error;

        // Calculate totals
        const salesInvoices = invoices?.filter(inv => inv.invoice_type === 'sales') || [];
        const purchaseInvoices = invoices?.filter(inv => inv.invoice_type === 'purchase') || [];

        const totalRev = salesInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
        setTotalRevenue(totalRev);

        const totalPurch = purchaseInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
        setTotalPurchases(totalPurch);

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isToday = (dateString: string) => {
          const date = new Date(dateString);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        };

        const todaySalesTotal = salesInvoices
          .filter(inv => isToday(inv.created_at))
          .reduce((sum, inv) => sum + Number(inv.total), 0);
        setTodaySales(todaySalesTotal);

        const todayPurchasesTotal = purchaseInvoices
          .filter(inv => isToday(inv.created_at))
          .reduce((sum, inv) => sum + Number(inv.total), 0);
        setTodayPurchases(todayPurchasesTotal);

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}k`;
    }
    return `€${value.toFixed(0)}`;
  };

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back! Here's what's happening with your business.">
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Products" value={loading ? '-' : products.length} icon={Package} iconColor="text-accent" iconBg="bg-accent/10" />
          <StatCard title="Total Revenue" value={statsLoading ? '-' : formatCurrency(totalRevenue)} icon={DollarSign} iconColor="text-success" iconBg="bg-success/10" />
          <StatCard title="Total Purchases" value={statsLoading ? '-' : formatCurrency(totalPurchases)} icon={ShoppingCart} iconColor="text-destructive" iconBg="bg-destructive/10" changeType="negative" />
          <StatCard title="Today's Sales" value={statsLoading ? '-' : formatCurrency(todaySales)} icon={TrendingUp} iconColor="text-primary" iconBg="bg-primary/10" />
          <StatCard title="Low Stock" value={loading ? '-' : lowStockItems} icon={AlertTriangle} iconColor="text-warning" iconBg="bg-warning/10" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SalesChart /></div>
          <div><LowStockAlert /></div>
        </div>
        <RecentInvoices />
      </div>
    </MainLayout>
  );
}
