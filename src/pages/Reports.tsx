import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Download, DollarSign, Package, FileText, Users, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subWeeks, startOfWeek, endOfWeek, format, isWithinInterval } from 'date-fns';

const COLORS = ['hsl(173, 58%, 39%)', 'hsl(222, 47%, 20%)', 'hsl(38, 92%, 50%)', 'hsl(215, 20%, 65%)', 'hsl(280, 60%, 50%)'];

interface Stats {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  totalOrders: number;
  lastMonthOrders: number;
  productsSold: number;
  lastMonthProductsSold: number;
  activeCustomers: number;
  lastMonthCustomers: number;
}

interface WeeklyRevenue {
  name: string;
  revenue: number;
}

interface CategoryData {
  category: string;
  count: number;
}

const calculateChange = (current: number, previous: number): string => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

const exportToCSV = (data: Record<string, unknown>[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const key = h.toLowerCase().replace(/ /g, '_').replace(/[()€]/g, '');
      const value = row[key] ?? row[h] ?? '';
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success('Report exported successfully!');
};

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    totalOrders: 0,
    lastMonthOrders: 0,
    productsSold: 0,
    lastMonthProductsSold: 0,
    activeCustomers: 0,
    lastMonthCustomers: 0,
  });
  const [weeklyRevenue, setWeeklyRevenue] = useState<WeeklyRevenue[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [invoicesData, setInvoicesData] = useState<unknown[]>([]);
  const [productsData, setProductsData] = useState<unknown[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);

        // Fetch all invoices with items
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)');

        if (invoicesError) throw invoicesError;

        setInvoicesData(invoices || []);

        // Calculate this month stats
        const thisMonthInvoices = (invoices || []).filter(inv => 
          new Date(inv.created_at) >= thisMonthStart
        );
        const thisMonthPaid = thisMonthInvoices.filter(inv => inv.status === 'paid');
        const thisMonthRevenue = thisMonthPaid.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
        const thisMonthProductsSold = thisMonthInvoices.reduce((sum, inv) => 
          sum + (inv.invoice_items?.reduce((itemSum: number, item: { quantity: number }) => itemSum + item.quantity, 0) || 0), 0);
        const thisMonthCustomers = new Set(thisMonthInvoices.map(inv => inv.customer_id).filter(Boolean)).size;

        // Calculate last month stats
        const lastMonthInvoices = (invoices || []).filter(inv => {
          const date = new Date(inv.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        });
        const lastMonthPaid = lastMonthInvoices.filter(inv => inv.status === 'paid');
        const lastMonthRevenue = lastMonthPaid.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
        const lastMonthProductsSold = lastMonthInvoices.reduce((sum, inv) => 
          sum + (inv.invoice_items?.reduce((itemSum: number, item: { quantity: number }) => itemSum + item.quantity, 0) || 0), 0);
        const lastMonthCustomers = new Set(lastMonthInvoices.map(inv => inv.customer_id).filter(Boolean)).size;

        setStats({
          thisMonthRevenue,
          lastMonthRevenue,
          totalOrders: thisMonthInvoices.length,
          lastMonthOrders: lastMonthInvoices.length,
          productsSold: thisMonthProductsSold,
          lastMonthProductsSold,
          activeCustomers: thisMonthCustomers,
          lastMonthCustomers,
        });

        // Calculate weekly revenue for last 4 weeks
        const weeklyData: WeeklyRevenue[] = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
          const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
          
          const weekInvoices = (invoices || []).filter(inv => {
            const date = new Date(inv.created_at);
            return inv.status === 'paid' && isWithinInterval(date, { start: weekStart, end: weekEnd });
          });
          
          const weekRevenue = weekInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
          weeklyData.push({
            name: format(weekStart, 'MMM d'),
            revenue: weekRevenue,
          });
        }
        setWeeklyRevenue(weeklyData);

        // Fetch products for category breakdown
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*');

        if (productsError) throw productsError;

        setProductsData(products || []);

        // Group by category
        const categoryMap: Record<string, number> = {};
        (products || []).forEach((p: { category: string; quantity: number }) => {
          categoryMap[p.category] = (categoryMap[p.category] || 0) + p.quantity;
        });

        const categoryArray = Object.entries(categoryMap).map(([category, count]) => ({
          category,
          count,
        })).sort((a, b) => b.count - a.count);

        setCategoryData(categoryArray);

      } catch (error) {
        console.error('Error fetching report data:', error);
        toast.error('Failed to load report data');
      }
      setLoading(false);
    };

    fetchReportData();
  }, []);

  const handleExportSalesReport = () => {
    const data = (invoicesData as { invoice_number: string; status: string; total: number; created_at: string }[]).map(inv => ({
      invoice_number: inv.invoice_number,
      status: inv.status,
      total: inv.total,
      date: format(new Date(inv.created_at), 'yyyy-MM-dd'),
    }));
    exportToCSV(data, 'sales-report.csv', ['Invoice Number', 'Status', 'Total', 'Date']);
  };

  const handleExportInventoryReport = () => {
    const data = (productsData as { name: string; category: string; quantity: number; min_stock: number; unit_price: number }[]).map(p => ({
      name: p.name,
      category: p.category,
      quantity: p.quantity,
      min_stock: p.min_stock,
      unit_price: p.unit_price,
      value: p.quantity * p.unit_price,
    }));
    exportToCSV(data, 'inventory-report.csv', ['Name', 'Category', 'Quantity', 'Min Stock', 'Unit Price', 'Value']);
  };

  const handleExportInvoiceReport = () => {
    const data = (invoicesData as { invoice_number: string; status: string; subtotal: number; shipping: number; total: number; created_at: string }[]).map(inv => ({
      invoice_number: inv.invoice_number,
      status: inv.status,
      subtotal: inv.subtotal,
      shipping: inv.shipping,
      total: inv.total,
      date: format(new Date(inv.created_at), 'yyyy-MM-dd'),
    }));
    exportToCSV(data, 'invoice-report.csv', ['Invoice Number', 'Status', 'Subtotal', 'Shipping', 'Total', 'Date']);
  };

  const handleExportWeeklyRevenue = () => {
    exportToCSV(weeklyRevenue.map(w => ({ week: w.name, revenue: w.revenue })), 'weekly-revenue.csv', ['Week', 'Revenue']);
  };

  const statCards = useMemo(() => [
    { 
      title: 'This Month Revenue', 
      value: `€${stats.thisMonthRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      change: calculateChange(stats.thisMonthRevenue, stats.lastMonthRevenue) 
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toString(), 
      icon: FileText, 
      change: calculateChange(stats.totalOrders, stats.lastMonthOrders) 
    },
    { 
      title: 'Products Sold', 
      value: stats.productsSold.toString(), 
      icon: Package, 
      change: calculateChange(stats.productsSold, stats.lastMonthProductsSold) 
    },
    { 
      title: 'Active Customers', 
      value: stats.activeCustomers.toString(), 
      icon: Users, 
      change: calculateChange(stats.activeCustomers, stats.lastMonthCustomers) 
    },
  ], [stats]);

  const reportButtons = [
    { title: 'Sales Report', description: 'Complete sales summary', icon: TrendingUp, onClick: handleExportSalesReport },
    { title: 'Inventory Report', description: 'Stock levels & values', icon: Package, onClick: handleExportInventoryReport },
    { title: 'Invoice Report', description: 'All invoices & status', icon: FileText, onClick: handleExportInvoiceReport },
    { title: 'Weekly Revenue', description: 'Revenue by week', icon: BarChart3, onClick: handleExportWeeklyRevenue },
  ];

  if (loading) {
    return (
      <MainLayout title="Reports & Analytics" subtitle="Track your business performance and insights">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Reports & Analytics" subtitle="Track your business performance and insights">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {stat.change} vs last month
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Weekly Revenue</CardTitle>
                <CardDescription>Revenue breakdown by week (last 4 weeks)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportWeeklyRevenue}>
                <Download className="h-4 w-4 mr-2" />Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {weeklyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 16%, 47%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 16%, 47%)" fontSize={12} tickFormatter={(v) => `€${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(214, 32%, 91%)', borderRadius: '8px' }} 
                        formatter={(value: number) => [`€${value.toLocaleString()}`, 'Revenue']} 
                      />
                      <Bar dataKey="revenue" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Products by Category</CardTitle>
              <CardDescription>Inventory distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={categoryData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={100} 
                        paddingAngle={5} 
                        dataKey="count" 
                        label={({ category, count }) => `${category}: ${count}`} 
                        labelLine={false}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">No product data available</div>
                )}
              </div>
              {categoryData.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {categoryData.map((entry, index) => (
                    <div key={entry.category} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm text-muted-foreground">{entry.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
            <CardDescription>Export detailed reports for your records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportButtons.map((report) => (
                <button 
                  key={report.title} 
                  onClick={report.onClick}
                  className="p-4 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:bg-accent/10 transition-colors">
                    <report.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
