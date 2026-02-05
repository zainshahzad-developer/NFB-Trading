import { Invoice } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useRef } from 'react';
import {
  Search,
  Plus,
  Eye,
  Download,
  FileText,
  Filter,
  MoreVertical,
  Loader2,
  Trash2,
  Pencil,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CreateInvoiceDialog } from './CreateInvoiceDialog';
import { ViewInvoiceDialog } from './ViewInvoiceDialog';
import { EditInvoiceDialog } from './EditInvoiceDialog';
import { useInvoices } from '@/hooks/useInvoices';
import { useProducts } from '@/hooks/useProducts';
import { useExcelInvoice } from '@/hooks/useExcelInvoice';
import { useCustomers } from '@/hooks/useCustomers';
import { useSellers } from '@/hooks/useSellers';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusStyles = {
  paid: 'bg-success/10 text-success border-success/20',
  sent: 'bg-accent/10 text-accent border-accent/20',
  draft: 'bg-muted text-muted-foreground border-muted',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

const invoiceTypeStyles = {
  sales: 'bg-accent/10 text-accent border-accent/20',
  purchase: 'bg-success/10 text-success border-success/20',
};

const purchaseTemplateStyles = {
  'purchase-stock': 'bg-green-100 text-green-700 border-green-300',
  'purchase-presale': 'bg-blue-100 text-blue-700 border-blue-300',
  'purchase-nfb': 'bg-amber-100 text-amber-700 border-amber-300',
  'purchase-teletek': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  'purchase-jsp': 'bg-cyan-100 text-cyan-700 border-cyan-300',
};

interface InvoiceListProps {
  defaultType?: string;
  hideTypeFilter?: boolean;
}

export function InvoiceList({ defaultType = 'all', hideTypeFilter = false }: InvoiceListProps) {
  const { invoices, loading, deleteInvoice, updateInvoice, createInvoice, refetch } = useInvoices();
  const { products, adjustStock } = useProducts();
  const { customers } = useCustomers();
  const { sellers } = useSellers();
  const { generateExcelTemplate, parseExcelFile } = useExcelInvoice();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>(defaultType);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    setIsDeleting(true);
    try {
      // For sales invoices: restore stock by adding back the quantities
      // For purchase invoices: deduct stock by removing the quantities
      await deleteInvoice(invoiceToDelete.id, async (productId, quantity) => {
        const stockChange = invoiceToDelete.invoiceType === 'purchase' ? -quantity : quantity;
        await adjustStock(productId, stockChange);
      });
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExcelDownload = () => {
    generateExcelTemplate();
    toast.success('Excel template downloaded. Fill in the invoice details and upload it back.');
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingExcel(true);
    try {
      const excelData = await parseExcelFile(file);
      if (!excelData) {
        toast.error('Failed to parse Excel file');
        return;
      }

      // Find or create customer based on the Excel data
      let customerId = '';
      if (excelData.customerName) {
        const existingCustomer = customers.find(
          c => c.name.toLowerCase() === excelData.customerName.toLowerCase()
        );
        if (existingCustomer) {
          customerId = existingCustomer.id;
        }
      }

      // Get default seller (NFB)
      const nfbSeller = sellers.find(s =>
        s.companyName?.toLowerCase().includes('nfb') ||
        s.name.toLowerCase().includes('nfb')
      );

      // Map Excel items to invoice items
      const invoiceItems = excelData.items.map(item => {
        // Try to find matching product
        const matchingProduct = products.find(p =>
          p.name.toLowerCase().includes(item.phoneModel.toLowerCase()) ||
          item.phoneModel.toLowerCase().includes(p.name.toLowerCase())
        );

        return {
          productId: matchingProduct?.id || '',
          productName: item.phoneModel,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          color: item.color,
          specs: matchingProduct?.specs || '',
        };
      });

      // Create the invoice with stock adjustment
      await createInvoice({
        invoiceNumber: excelData.invoiceNumber,
        customerId: customerId || undefined,
        sellerId: nfbSeller?.id,
        billingAddress: excelData.billingAddress,
        shippingAddress: excelData.shippingAddress,
        items: invoiceItems,
        subtotal: excelData.subTotal,
        tax: 0,
        discount: 0,
        shipping: excelData.shipping,
        total: excelData.total,
        status: 'draft',
        template: 'nfb-trading',
        invoiceType: 'sales',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }, adjustStock);

      toast.success(`Invoice ${excelData.invoiceNumber} created successfully from Excel`);
      refetch();
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process Excel file');
    } finally {
      setIsProcessingExcel(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.invoiceType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Invoices', value: invoices.length, color: 'text-foreground' },
          { label: 'Sales', value: invoices.filter(i => i.invoiceType === 'sales').length, color: 'text-accent' },
          { label: 'Purchase', value: invoices.filter(i => i.invoiceType === 'purchase').length, color: 'text-success' },
          { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: 'text-success' },
          { label: 'Pending', value: invoices.filter(i => i.status === 'sent' || i.status === 'draft').length, color: 'text-accent' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-card p-4 border border-border">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 input-focus"
          />
        </div>
        <div className="flex gap-2">
          {!hideTypeFilter && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isProcessingExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={handleExcelDownload}>
                <Download className="h-4 w-4 mr-2" />
                Create Invoice in Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
          {!hideTypeFilter && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="btn-accent-gradient">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
          <p className="text-muted-foreground mb-4">Create your first invoice to get started</p>
          {!hideTypeFilter && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="btn-accent-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      ) : (
        /* Invoice Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-xl bg-card border border-border p-5 shadow-card transition-all duration-200 hover:shadow-lg hover:border-accent/30"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-card-foreground">{invoice.invoiceNumber}</p>
                      {invoice.invoiceType === 'purchase' ? (
                        <Badge variant="outline" className={cn('text-xs', purchaseTemplateStyles[invoice.template as keyof typeof purchaseTemplateStyles] || 'bg-success/10 text-success border-success/20')}>
                          {invoice.template === 'purchase-stock' ? 'Stock' :
                            invoice.template === 'purchase-presale' ? 'Pre-Sale' :
                              invoice.template === 'purchase-nfb' ? 'NFB' :
                                invoice.template === 'purchase-teletek' ? 'Teletek' :
                                  invoice.template === 'purchase-jsp' ? 'JSP' : 'Purchase'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={cn('text-xs capitalize', invoiceTypeStyles[invoice.invoiceType || 'sales'])}>
                          {invoice.invoiceType || 'sales'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {invoice.template === 'purchase-stock' ? 'Stock Purchase (Generic)' :
                        invoice.template === 'purchase-presale' ? 'Pre-Sale Purchase (Generic)' :
                          invoice.template === 'purchase-nfb' ? 'NFB Purchase Order' :
                            invoice.template === 'purchase-teletek' ? 'Teletek Purchase Order' :
                              invoice.template === 'purchase-jsp' ? 'JSP Purchase Order' :
                                `${invoice.template} template`}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => {
                      setSelectedInvoice(invoice);
                      setIsViewDialogOpen(true);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setInvoiceToEdit(invoice);
                      setIsEditDialogOpen(true);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setInvoiceToDelete(invoice)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {invoice.invoiceType === 'purchase' ? (invoice.seller?.name || 'Unknown Seller') : (invoice.customer?.name || 'Unknown Customer')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.invoiceType === 'purchase' ? invoice.seller?.email : invoice.customer?.email}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold text-card-foreground">
                      €{invoice.total.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
                    {invoice.status}
                  </Badge>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created: {format(invoice.createdAt, 'MMM d, yyyy')}</span>
                  <span>Due: {format(invoice.dueDate, 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetch}
      />

      {/* View Invoice Dialog */}
      <ViewInvoiceDialog
        invoice={selectedInvoice}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* Edit Invoice Dialog */}
      <EditInvoiceDialog
        invoice={invoiceToEdit}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={async (id, updates, stockAdjustments) => {
          await updateInvoice(id, updates, stockAdjustments, adjustStock);
          setInvoiceToEdit(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>?
              This will restore the stock for all items in this invoice. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
