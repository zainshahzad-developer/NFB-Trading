import { MainLayout } from '@/components/layout/MainLayout';
import { InvoiceList } from '@/components/invoices/InvoiceList';

export default function Invoices() {
  return (
    <MainLayout 
      title="Invoices" 
      subtitle="Create and manage your sales invoices"
    >
      <InvoiceList />
    </MainLayout>
  );
}
