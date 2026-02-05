import { AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';

export function LowStockAlert() {
  const { products, loading } = useProducts();
  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);

  if (loading || lowStockProducts.length === 0) return null;

  return (
    <div className="rounded-xl bg-warning/5 border border-warning/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Low Stock Alert</h3>
          <p className="text-sm text-muted-foreground">
            {lowStockProducts.length} products need restocking
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {lowStockProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-lg bg-card p-3 border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.color}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-destructive">{product.quantity} left</p>
              <p className="text-xs text-muted-foreground">Min: {product.minStock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
