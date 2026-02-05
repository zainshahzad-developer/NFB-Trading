
import { MainLayout } from '@/components/layout/MainLayout';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreatePurchaseBillDialog } from '@/components/invoices/CreatePurchaseBillDialog';
import { useInvoices } from '@/hooks/useInvoices';

export default function PurchaseBills() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { refetch } = useInvoices();

    return (
        <MainLayout
            title="Purchase Bills"
            subtitle="Manage your purchase bills and expenses"
        >
            <div className="space-y-6">
                <div className="flex justify-end">
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="btn-accent-gradient">
                        <Plus className="h-4 w-4 mr-2" />
                        New Purchase Bill
                    </Button>
                </div>

                {/* Reusing InvoiceList but will filter for 'purchase' type inside it or we can pass filter props if we refactor InvoiceList 
            For now, InvoiceList handles its own filtering, so we might see duplication if we don't refactor.
            However, the requirement says "Purchase Bill section", implying a separate view.
            The InvoiceList component in this codebase seems to have internal state for filtering.
            I will use a modified approach: I'll wrap InvoiceList or reuse it if it supports external filtering control.
            Looking at InvoiceList.tsx, it has local state for filters. 
            Detailed plan said: "Reuse InvoiceList or create a wrapper that filters by invoiceType === 'purchase' and sets a specific mode."
            Actually, InvoiceList has a 'typeFilter' state. It's better to default it to 'purchase' or hide the toggle.
            But since I cannot easily refactor InvoiceList to accept props for initial filter without modifying it significantly (it uses internal state),
            I will modify InvoiceList to accept an optional `defaultType` prop.
        */}
                <InvoiceList defaultType="purchase" hideTypeFilter={true} />

                <CreatePurchaseBillDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onSuccess={refetch}
                />
            </div>
        </MainLayout>
    );
}
