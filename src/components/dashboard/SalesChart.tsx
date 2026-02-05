import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3 } from 'lucide-react';

interface MonthlySales {
  month: string;
  sales: number;
}

export function SalesChart() {
  const [salesData, setSalesData] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Fetch only sales invoices (not purchase orders)
        const { data, error } = await supabase
          .from('invoices')
          .select('total, created_at, status')
          .eq('invoice_type', 'sales');

        if (error) throw error;

        // Get current year and filter data for last 12 months
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Create array for last 12 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Group by month-year
        const monthlyData: Record<string, number> = {};
        
        data?.forEach(invoice => {
          const date = new Date(invoice.created_at);
          const invoiceYear = date.getFullYear();
          const invoiceMonth = date.getMonth();
          
          // Only include invoices from current year
          if (invoiceYear === currentYear) {
            const monthKey = months[invoiceMonth];
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(invoice.total);
          }
        });

        // Convert to array format for chart - show all months of current year
        const chartData = months.map(month => ({
          month,
          sales: Math.round((monthlyData[month] || 0) * 100) / 100,
        }));

        setSalesData(chartData);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const hasData = salesData.some(d => d.sales > 0);

  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Sales Overview</h3>
        <p className="text-sm text-muted-foreground">Monthly revenue trends ({new Date().getFullYear()})</p>
      </div>
      <div className="h-[300px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No sales data yet</p>
            <p className="text-sm text-muted-foreground">Sales will appear here once invoices are created</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="month" stroke="hsl(215, 16%, 47%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="hsl(215, 16%, 47%)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => value >= 1000 ? `€${(value / 1000).toFixed(0)}k` : `€${value}`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(214, 32%, 91%)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: number) => [`€${value.toLocaleString()}`, 'Sales']}
              />
              <Area type="monotone" dataKey="sales" stroke="hsl(173, 58%, 39%)" strokeWidth={2} fill="url(#salesGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
