import { MainLayout } from '@/components/layout/MainLayout';
import { StockTable } from '@/components/stock/StockTable';

export default function Stock() {
  return (
    <MainLayout 
      title="Stock Management" 
      subtitle="Manage your product inventory and stock levels"
    >
      <StockTable />
    </MainLayout>
  );
}
