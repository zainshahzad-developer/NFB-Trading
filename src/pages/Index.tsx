import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { Package, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';

export default function Index() {
  const { products, loading } = useProducts();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const lowStockItems = products.filter(p => p.quantity <= p.minStock).length;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all sales invoices
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('total, created_at')
          .eq('invoice_type', 'sales');

        if (error) throw error;

        // Calculate total revenue from all sales invoices
        const total = invoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
        setTotalRevenue(total);

        // Calculate today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTotal = invoices?.filter(inv => {
          const invDate = new Date(inv.created_at);
          invDate.setHours(0, 0, 0, 0);
          return invDate.getTime() === today.getTime();
        }).reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
        setTodaySales(todayTotal);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Products" value={loading ? '-' : products.length} icon={Package} iconColor="text-accent" iconBg="bg-accent/10" />
          <StatCard title="Total Revenue" value={statsLoading ? '-' : formatCurrency(totalRevenue)} icon={DollarSign} iconColor="text-success" iconBg="bg-success/10" />
          <StatCard title="Today's Sales" value={statsLoading ? '-' : formatCurrency(todaySales)} icon={ShoppingCart} iconColor="text-primary" iconBg="bg-primary/10" />
          <StatCard title="Low Stock Items" value={loading ? '-' : lowStockItems} icon={AlertTriangle} iconColor="text-warning" iconBg="bg-warning/10" />
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
