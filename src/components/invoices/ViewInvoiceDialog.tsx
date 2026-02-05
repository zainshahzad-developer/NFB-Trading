import { useRef } from 'react';
import { Invoice } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Download, Printer } from 'lucide-react';
import nfbLogo from '@/assets/nfb-trading-logo.png';
import jspLogo from '@/assets/jsp-logo.png';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
interface ViewInvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const statusStyles = {
  paid: 'bg-success/10 text-success border-success/20',
  sent: 'bg-accent/10 text-accent border-accent/20',
  draft: 'bg-muted text-muted-foreground border-muted',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20'
};
export function ViewInvoiceDialog({
  invoice,
  open,
  onOpenChange
}: ViewInvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  if (!invoice) return null;
  const isPurchase = invoice.invoiceType === 'purchase';
  const isPurchaseStock = invoice.template === 'purchase-stock';
  const isPurchasePreSale = invoice.template === 'purchase-presale';
  const isPurchaseNFB = invoice.template === 'purchase-nfb';
  const isPurchaseTeletek = invoice.template === 'purchase-teletek';
  const isPurchaseJSP = invoice.template === 'purchase-jsp';
  const isNFBTemplate = invoice.template === 'nfb-trading';
  const isPackingNFB = invoice.template === 'packing-nfb';
  const isTeletekTemplate = invoice.template === 'teletek';
  const isJSPTemplate = invoice.template === 'jsp';
  const totalQty = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Unable to open print window. Please check your popup blocker.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; }
            .border { border: 1px solid #ccc; }
            .border-b { border-bottom: 1px solid #ccc; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-xs { font-size: 11px; }
            .text-sm { font-size: 13px; }
            .mb-4 { margin-bottom: 16px; }
            .p-3 { padding: 12px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .logo { height: 60px; object-fit: contain; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;
    toast.info('Generating PDF...');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // Purchase Invoice - STOCK Template (Green themed)
  if (isPurchaseStock) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="purchase-stock-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-green-700">Stock Purchase {invoice.invoiceNumber}</span>
            <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="purchase-stock-description">
            Stock intake purchase order - adds inventory
          </DialogDescription>
        </DialogHeader>

        <div ref={invoiceRef} className="bg-white text-black rounded-lg p-6 text-sm">
          {/* Header - Green themed */}
          <div className="flex justify-between items-start mb-4 pb-4 border-b-4 border-green-600">
            <div>
              <h1 className="text-2xl font-bold text-green-700">PURCHASE ORDER</h1>
              <p className="text-lg font-semibold text-green-600 mt-1">STOCK INTAKE</p>
              <p className="text-xs text-gray-500 mt-2">Date: {format(invoice.createdAt, 'dd/MM/yyyy')}</p>
            </div>
            <div className="text-right">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <p className="text-xs text-green-600 font-medium">PO Number</p>
                <p className="text-lg font-bold text-green-700">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>

          {/* Supplier Info Section */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-700 mb-2 text-sm uppercase tracking-wide">Supplier Details</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium text-gray-600">Company:</span> {invoice.customer?.companyName || invoice.customer?.name || '—'}</p>
                <p><span className="font-medium text-gray-600">Contact:</span> {invoice.customer?.name || '—'}</p>
                <p><span className="font-medium text-gray-600">Phone:</span> {invoice.customer?.phone || '—'}</p>
                <p><span className="font-medium text-gray-600">Email:</span> {invoice.customer?.email || '—'}</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Delivery Details</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium text-gray-600">Billing:</span> {invoice.billingAddress || '—'}</p>
                <p><span className="font-medium text-gray-600">Shipping:</span> {invoice.shippingAddress || '—'}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-2 border-green-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-xs">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="text-left py-3 px-3 font-semibold">Product Description</th>
                  <th className="text-center py-3 px-3 font-semibold">Specs</th>
                  <th className="text-center py-3 px-3 font-semibold">Color</th>
                  <th className="text-center py-3 px-3 font-semibold">Qty</th>
                  <th className="text-right py-3 px-3 font-semibold">Unit Price</th>
                  <th className="text-right py-3 px-3 font-semibold">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                  <td className="py-2 px-3 font-medium">{item.productName}</td>
                  <td className="py-2 px-3 text-center text-gray-600">{item.specs || '—'}</td>
                  <td className="py-2 px-3 text-center">{item.color || '—'}</td>
                  <td className="py-2 px-3 text-center font-semibold">{item.quantity}</td>
                  <td className="py-2 px-3 text-right">€ {item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-semibold">€ {item.lineTotal.toLocaleString()}</td>
                </tr>)}
              </tbody>
              <tfoot className="bg-green-100">
                <tr className="border-t-2 border-green-300">
                  <td colSpan={3} className="py-3 px-3 font-bold text-green-700">TOTAL QUANTITY</td>
                  <td className="py-3 px-3 text-center font-bold text-green-700 text-lg">{totalQty}</td>
                  <td className="py-3 px-3 text-right font-bold text-green-700">GRAND TOTAL</td>
                  <td className="py-3 px-3 text-right font-bold text-green-700 text-lg">€ {invoice.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="font-semibold text-green-700 text-xs mb-1">STOCK NOTES</p>
              <p className="text-xs text-gray-600">Items will be added to inventory upon confirmation.</p>
            </div>
            <div className="flex items-center justify-end">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-center">
                <p className="text-xs opacity-80">FOR INVENTORY</p>
                <p className="font-bold">STOCK INTAKE</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
  }

  // Purchase Invoice - PRE-SALE Template (Blue themed)
  if (isPurchasePreSale) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="purchase-presale-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-blue-700">Pre-Sale Order {invoice.invoiceNumber}</span>
            <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="purchase-presale-description">
            Pre-sale purchase order - reserved goods for customer
          </DialogDescription>
        </DialogHeader>

        <div ref={invoiceRef} className="bg-white text-black rounded-lg p-6 text-sm">
          {/* Header - Blue themed */}
          <div className="flex justify-between items-start mb-4 pb-4 border-b-4 border-blue-600">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">PURCHASE ORDER</h1>
              <p className="text-lg font-semibold text-blue-600 mt-1">PRE-SALE ORDER</p>
              <p className="text-xs text-gray-500 mt-2">Date: {format(invoice.createdAt, 'dd/MM/yyyy')}</p>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-xs text-blue-600 font-medium">PO Number</p>
                <p className="text-lg font-bold text-blue-700">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>

          {/* Customer & Supplier Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-700 mb-2 text-sm uppercase tracking-wide">Customer Details</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium text-gray-600">Company:</span> {invoice.customer?.companyName || invoice.customer?.name || '—'}</p>
                <p><span className="font-medium text-gray-600">Contact:</span> {invoice.customer?.name || '—'}</p>
                <p><span className="font-medium text-gray-600">Phone:</span> {invoice.customer?.phone || '—'}</p>
                <p><span className="font-medium text-gray-600">Email:</span> {invoice.customer?.email || '—'}</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Delivery Details</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium text-gray-600">Billing:</span> {invoice.billingAddress || '—'}</p>
                <p><span className="font-medium text-gray-600">Shipping:</span> {invoice.shippingAddress || '—'}</p>
                <p><span className="font-medium text-gray-600">Expected:</span> {invoice.dueDate ? format(invoice.dueDate, 'dd/MM/yyyy') : '—'}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-2 border-blue-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-xs">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="text-left py-3 px-3 font-semibold">Product Description</th>
                  <th className="text-center py-3 px-3 font-semibold">Specs</th>
                  <th className="text-center py-3 px-3 font-semibold">Color</th>
                  <th className="text-center py-3 px-3 font-semibold">Qty</th>
                  <th className="text-right py-3 px-3 font-semibold">Unit Price</th>
                  <th className="text-right py-3 px-3 font-semibold">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                  <td className="py-2 px-3 font-medium">{item.productName}</td>
                  <td className="py-2 px-3 text-center text-gray-600">{item.specs || '—'}</td>
                  <td className="py-2 px-3 text-center">{item.color || '—'}</td>
                  <td className="py-2 px-3 text-center font-semibold">{item.quantity}</td>
                  <td className="py-2 px-3 text-right">€ {item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-semibold">€ {item.lineTotal.toLocaleString()}</td>
                </tr>)}
              </tbody>
              <tfoot className="bg-blue-100">
                <tr className="border-t-2 border-blue-300">
                  <td colSpan={3} className="py-3 px-3 font-bold text-blue-700">TOTAL QUANTITY</td>
                  <td className="py-3 px-3 text-center font-bold text-blue-700 text-lg">{totalQty}</td>
                  <td className="py-3 px-3 text-right font-bold text-blue-700">GRAND TOTAL</td>
                  <td className="py-3 px-3 text-right font-bold text-blue-700 text-lg">€ {invoice.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-semibold text-blue-700 text-xs mb-1">PRE-SALE NOTES</p>
              <p className="text-xs text-gray-600">Items reserved for customer order. Stock will be allocated upon delivery confirmation.</p>
            </div>
            <div className="flex items-center justify-end">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center">
                <p className="text-xs opacity-80">RESERVED GOODS</p>
                <p className="font-bold">PRE-SALE ORDER</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
  }

  // Purchase NFB Template - NFB Trading styled purchase order
  if (isPurchaseNFB) {
    const isStock = invoice.invoiceType === 'purchase';
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="purchase-nfb-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Purchase Order {invoice.invoiceNumber}</span>
            <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="purchase-nfb-description">
            NFB Trading purchase order - adds inventory
          </DialogDescription>
        </DialogHeader>

        <div ref={invoiceRef} className="bg-white text-black rounded-lg p-6 text-sm">
          {/* Header with Logo */}
          <div className="flex justify-between items-start mb-4">
            <img src={nfbLogo} alt="NFB Trading Ltd" className="h-16 object-contain" />
            <div className="text-right">
              <h1 className="text-xl font-bold text-gray-800">PURCHASE ORDER</h1>
              <p className="text-sm text-green-600 font-semibold">Stock Intake</p>
            </div>
          </div>

          {/* Date and PO Number Row */}
          <div className="flex justify-between mb-4 border-b border-gray-300 pb-2">
            <div>
              <span className="font-semibold">Date:</span> {format(invoice.createdAt, 'dd/MM/yyyy')}
            </div>
            <div>
              <span className="font-semibold">PO #:</span> {invoice.invoiceNumber}
            </div>
          </div>

          {/* Supplier & Delivery Info */}
          <div className="grid grid-cols-2 gap-0 mb-4 border border-gray-300">
            <div className="p-3 border-r border-gray-300">
              <p className="font-semibold text-gray-600 mb-2">Supplier Details:</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Company:</span> {invoice.customer?.companyName || invoice.customer?.name || '—'}</p>
                <p><span className="font-medium">Contact:</span> {invoice.customer?.name || '—'}</p>
                <p><span className="font-medium">Phone:</span> {invoice.customer?.phone || '—'}</p>
                <p><span className="font-medium">Email:</span> {invoice.customer?.email || '—'}</p>
              </div>
            </div>
            <div className="p-3">
              <p className="font-semibold text-gray-600 mb-2">Delivery Details:</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Address:</span> {invoice.billingAddress || invoice.shippingAddress || '—'}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-300 mb-4">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold border-b border-gray-300">Product</th>
                  <th className="text-center py-2 px-3 font-semibold border-b border-gray-300">Specs</th>
                  <th className="text-center py-2 px-3 font-semibold border-b border-gray-300">Color</th>
                  <th className="text-center py-2 px-3 font-semibold border-b border-gray-300">Qty</th>

                  {/* New Columns for Purchase Details - visible if present */}
                  {invoice.items.some(i => i.buyingCurrency) && (
                    <>
                      <th className="text-center py-2 px-3 font-semibold border-b border-gray-300">Cur</th>
                      <th className="text-right py-2 px-3 font-semibold border-b border-gray-300">Rate</th>
                      <th className="text-right py-2 px-3 font-semibold border-b border-gray-300">Buy Price</th>
                    </>
                  )}

                  <th className="text-right py-2 px-3 font-semibold border-b border-gray-300">Unit (EUR)</th>
                  <th className="text-right py-2 px-3 font-semibold border-b border-gray-300">Total (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-3">{item.productName}</td>
                  <td className="py-2 px-3 text-center">{item.specs || '—'}</td>
                  <td className="py-2 px-3 text-center">{item.color || '—'}</td>
                  <td className="py-2 px-3 text-center font-semibold">{item.quantity}</td>

                  {/* New Columns Data */}
                  {invoice.items.some(i => i.buyingCurrency) && (
                    <>
                      <td className="py-2 px-3 text-center">{item.buyingCurrency || '-'}</td>
                      <td className="py-2 px-3 text-right">{item.buyingRate || '-'}</td>
                      <td className="py-2 px-3 text-right">{item.buyingPriceOriginal?.toFixed(2) || '-'}</td>
                    </>
                  )}

                  <td className="py-2 px-3 text-right">€ {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-2 px-3 text-right font-semibold">€ {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>)}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="border-t border-gray-300">
                  <td colSpan={3} className="py-2 px-3 font-semibold">Total Quantity:</td>
                  <td className="py-2 px-3 text-center font-bold">{totalQty}</td>

                  {/* Span adjustments */}
                  {invoice.items.some(i => i.buyingCurrency) && <td colSpan={3}></td>}

                  <td className="py-2 px-3 text-right font-semibold">Grand Total:</td>
                  <td className="py-2 px-3 text-right font-bold">€ {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-3 text-xs text-gray-600">
            <div className="flex justify-between items-center">
              <p><span className="font-medium">Note:</span> Items will be added to inventory upon confirmation.</p>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded font-semibold text-xs">
                STOCK INTAKE
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" className="btn-accent-gradient" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
  }

  // Purchase Teletek Template - Teletek styled purchase order
  if (isPurchaseTeletek) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="purchase-teletek-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-[#1a365d]">Purchase Order {invoice.invoiceNumber}</span>
            <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="purchase-teletek-description">
            Teletek purchase order - adds inventory
          </DialogDescription>
        </DialogHeader>

        <div ref={invoiceRef} className="bg-white text-black p-6 text-sm" style={{
          fontFamily: 'Arial, sans-serif'
        }}>
          {/* Header with Logo */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800">TELETEK TECHNAHH BV</h1>
              <span className="text-xl font-bold" style={{ color: '#ed8936' }}>PURCHASE ORDER</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: '#1a365d' }}>TT</span>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="mb-4" style={{ fontSize: '11px' }}>
            <p><span className="font-semibold">PO No:</span> {invoice.invoiceNumber}</p>
            <p><span className="font-semibold">Date:</span> {format(invoice.createdAt, 'dd/MM/yyyy')}</p>
            <p><span className="font-semibold">Due Date:</span> {format(invoice.dueDate, 'dd/MM/yyyy')}</p>
          </div>

          {/* Supplier Info - Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Bill To */}
            <div>
              <div className="pb-1 mb-3" style={{ borderBottom: '1px solid #ed8936' }}>
                <h3 className="font-bold text-xs" style={{ color: '#ed8936' }}>SUPPLIER</h3>
              </div>
              <div style={{ fontSize: '11px' }} className="space-y-0.5">
                <p>Company name : {invoice.customer?.companyName || ''}</p>
                <p>Address: {invoice.billingAddress || ''}</p>
                <p>Phone: {invoice.customer?.phone || ''}</p>
                <p>Contact Person: {invoice.customer?.name || ''}</p>
                <p>Vat number: {invoice.customer?.vatNumber || ''}</p>
                <p>Email: {invoice.customer?.email || ''}</p>
              </div>
            </div>
            {/* Ship To */}
            <div>
              <div className="pb-1 mb-3" style={{ borderBottom: '1px solid #666' }}>
                <h3 className="font-bold text-xs" style={{ color: '#666' }}>SHIP TO</h3>
              </div>
              <div style={{ fontSize: '11px' }} className="space-y-0.5">
                <p>Company name : {invoice.customer?.companyName || ''}</p>
                <p>Address: {invoice.shippingAddress || ''}</p>
                <p>Phone: {invoice.customer?.phone || ''}</p>
                <p>Contact Person: {invoice.customer?.name || ''}</p>
                <p>Vat number: {invoice.customer?.vatNumber || ''}</p>
                <p>Email: {invoice.customer?.email || ''}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#ed8936', color: 'white' }}>
                  <th className="text-center py-2 px-3 font-semibold" style={{ width: '45%', border: '1px solid #ed8936' }}>DESCRIPTION</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{ width: '15%', border: '1px solid #ed8936' }}>QTY</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{ width: '20%', border: '1px solid #ed8936' }}>UNIT PRICE</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{ width: '20%', border: '1px solid #ed8936' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => <tr key={index}>
                  <td className="py-1.5 px-3 border border-gray-300">
                    {item.productName} {item.specs ? `(${item.specs})` : ''} {item.color ? `- ${item.color}` : ''}
                  </td>
                  <td className="py-1.5 px-3 text-center border border-gray-300">{item.quantity}</td>
                  <td className="py-1.5 px-3 text-center border border-gray-300">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">{item.lineTotal.toFixed(2)}</td>
                </tr>)}
                {/* Empty rows to fill 5 minimum */}
                {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => <tr key={`empty-${i}`}>
                  <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                  <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                  <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">0.00</td>
                </tr>)}
                {/* SUBTOTAL row */}
                <tr>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 text-center border border-gray-300 font-bold">{totalQty}</td>
                  <td className="py-1.5 px-3 text-right border border-gray-300 font-semibold">SUBTOTAL</td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">{invoice.subtotal.toFixed(2)}</td>
                </tr>
                {/* Discount row */}
                <tr>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">Discount</td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">{(invoice.discount || 0).toFixed(2)}</td>
                </tr>
                {/* SUBTOTAL LESS DISCOUNT row */}
                <tr>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 text-right border border-gray-300 font-semibold">SUBTOTAL LESS DISCOUNT</td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">{(invoice.subtotal - (invoice.discount || 0)).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Note and Tax Section - Side by Side */}
          <div className="flex justify-between items-start mb-6">
            {/* Note on left */}
            <div style={{ fontSize: '10px', maxWidth: '55%' }} className="text-gray-700">
              <p>Note: Broken phone or Black Dot in LCD should be notified within 48 hours. After 48 Hours claim will not be valid</p>
            </div>

            {/* Tax section on right */}
            <div style={{ fontSize: '11px' }}>
              <table className="border-collapse">
                <tbody>
                  <tr>
                    <td className="py-1 px-3 text-right border border-gray-300 font-bold">SUBTOTAL</td>
                    <td className="py-1 px-3 text-right border border-gray-300">{invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3 text-right border border-gray-300">Discount</td>
                    <td className="py-1 px-3 text-right border border-gray-300">{(invoice.discount || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3 text-right border border-gray-300 font-bold">SUBTOTAL LESS DISCOUNT</td>
                    <td className="py-1 px-3 text-right border border-gray-300">{(invoice.subtotal - (invoice.discount || 0)).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              {/* Balance Due - in a box */}
              <div className="flex justify-between items-center mt-3 p-2" style={{ border: '2px solid #333' }}>
                <span className="font-bold" style={{ color: '#ed8936' }}>Balance Due</span>
                <span className="font-bold text-base ml-6" style={{ color: '#ed8936' }}>€ {invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Instructions */}
          <div className="mb-4">
            <p className="font-bold text-sm mb-1" style={{ textDecoration: 'underline' }}>Terms & Instructions</p>
            <p style={{ fontSize: '11px' }}>GOODS ARE SOLD UNDER MARGINAL VAT SCHEME</p>
          </div>

          {/* Wire Instructions */}
          <div className="mb-8">
            <p className="font-bold text-sm mb-2" style={{ textDecoration: 'underline' }}>WIRE INSTRUCTION</p>
            <div style={{ fontSize: '11px' }} className="space-y-0.5">
              <p>Account Title: {invoice.bankAccount?.accountTitle || ''}</p>
              <p>IBAN: {invoice.bankAccount?.iban || ''}</p>
              <p>Swift: {invoice.bankAccount?.swift || ''}</p>
              <p>Bank: {invoice.bankAccount?.bankName || ''}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 pt-4" style={{ fontSize: '10px' }}>
            <p>Aventurijn 260, 3316 LB, Dordrecht, T 0031685083170, KVK 83438165, VAT ID NL862874579B01</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" className="btn-accent-gradient" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
  }

  // Purchase JSP Template - JSP styled purchase order
  if (isPurchaseJSP) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="purchase-jsp-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Purchase Order {invoice.invoiceNumber}</span>
            <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="purchase-jsp-description">
            JSP purchase order - adds inventory
          </DialogDescription>
        </DialogHeader>

        <div ref={invoiceRef} className="bg-white text-black p-8" style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px'
        }}>
          {/* Header Row - Company Name left, PURCHASE ORDER + Logo right */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold tracking-wide" style={{
                color: '#333',
                letterSpacing: '0.5px'
              }}>
                JASPELENDARIO UNIPESSOAL LDA
              </h1>
              <div style={{
                fontSize: '11px',
                color: '#555'
              }} className="mt-1 space-y-0">
                <p>R STARA- ZAGORA 23, 2830-364, UNIAO</p>
                <p>FREGUESIAS BARREIRO</p>
                <p style={{
                  color: '#1e4e79',
                  textDecoration: 'underline'
                }}>www.jaspelendario.com</p>
                <p className="mt-1">VAT: PT 518431738</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold" style={{
                  color: '#4a5568'
                }}>PURCHASE ORDER</h2>
                <img src={jspLogo} alt="JSP Logo" className="h-14 object-contain" />
              </div>
              <p className="text-sm font-semibold text-green-600 mt-1">Stock Intake</p>
            </div>
          </div>

          {/* Order Info Row */}
          <div className="flex justify-between mb-4 pb-2" style={{
            borderBottom: '2px solid #1e4e79'
          }}>
            <div className="text-xs">
              <span className="font-semibold">Date:</span> {format(invoice.createdAt, 'dd/MM/yyyy')}
            </div>
            <div className="text-xs">
              <span className="font-semibold">PO Number:</span> {invoice.invoiceNumber}
            </div>
          </div>

          {/* Supplier Info */}
          <div className="mb-4 p-3" style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <p className="font-semibold text-sm mb-2" style={{
              color: '#1e4e79'
            }}>SUPPLIER DETAILS</p>
            <div className="grid grid-cols-2 gap-4" style={{
              fontSize: '11px'
            }}>
              <div>
                <p><span className="font-medium">Company:</span> {invoice.customer?.companyName || invoice.customer?.name || '—'}</p>
                <p><span className="font-medium">Contact:</span> {invoice.customer?.name || '—'}</p>
              </div>
              <div>
                <p><span className="font-medium">Phone:</span> {invoice.customer?.phone || '—'}</p>
                <p><span className="font-medium">Email:</span> {invoice.customer?.email || '—'}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-4" style={{
            fontSize: '11px',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#1e4e79',
                color: 'white'
              }}>
                <th className="text-left py-2 px-3 font-semibold">Product</th>
                <th className="text-center py-2 px-3 font-semibold">Specs</th>
                <th className="text-center py-2 px-3 font-semibold">Color</th>
                <th className="text-center py-2 px-3 font-semibold">Qty</th>
                <th className="text-right py-2 px-3 font-semibold">Unit Price</th>
                <th className="text-right py-2 px-3 font-semibold">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => <tr key={index} style={{
                borderBottom: '1px solid #dee2e6',
                backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
              }}>
                <td className="py-2 px-3">{item.productName}</td>
                <td className="py-2 px-3 text-center">{item.specs || '—'}</td>
                <td className="py-2 px-3 text-center">{item.color || '—'}</td>
                <td className="py-2 px-3 text-center font-semibold">{item.quantity}</td>
                <td className="py-2 px-3 text-right">€ {item.unitPrice.toLocaleString()}</td>
                <td className="py-2 px-3 text-right font-semibold">€ {item.lineTotal.toLocaleString()}</td>
              </tr>)}
            </tbody>
            <tfoot>
              <tr style={{
                backgroundColor: '#e9ecef',
                borderTop: '2px solid #1e4e79'
              }}>
                <td colSpan={3} className="py-2 px-3 font-bold" style={{
                  color: '#1e4e79'
                }}>Total Quantity</td>
                <td className="py-2 px-3 text-center font-bold" style={{
                  color: '#1e4e79'
                }}>{totalQty}</td>
                <td className="py-2 px-3 text-right font-bold" style={{
                  color: '#1e4e79'
                }}>Grand Total</td>
                <td className="py-2 px-3 text-right font-bold" style={{
                  color: '#1e4e79'
                }}>€ {invoice.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="flex justify-between items-center pt-3" style={{
            borderTop: '2px solid #1e4e79'
          }}>
            <div style={{
              fontSize: '10px',
              color: '#6c757d'
            }}>
              <p>Items will be added to inventory upon confirmation.</p>
              <p className="mt-1">Marginal Goods - VAT not deductible</p>
            </div>
            <div className="px-3 py-1 rounded text-xs font-bold text-white" style={{
              backgroundColor: '#28a745'
            }}>
              STOCK INTAKE
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" style={{
            backgroundColor: '#1e4e79'
          }} className="text-white hover:opacity-90" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
  }

  // NFB Packing Invoice Format
  if (isPackingNFB) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="packing-invoice-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Packing Invoice {invoice.invoiceNumber}</span>
            <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="packing-invoice-description">
            NFB Packing invoice preview and download options
          </DialogDescription>
        </DialogHeader>

        {/* NFB Packing Invoice Preview */}
        <div ref={invoiceRef} className="bg-white text-black rounded-lg p-8 text-sm">
          {/* Header with Logo and Title */}
          <div className="flex items-start mb-6">
            <img src={nfbLogo} alt="NFB Trading Ltd" className="h-16 object-contain" />
            <h1 className="text-2xl font-bold text-gray-800 ml-8">Packing Invoice</h1>
            <div className="ml-auto text-right text-sm">
              <div className="flex gap-8">
                <span className="text-gray-600">Date:</span>
                <span>{format(invoice.createdAt, 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex gap-8 mt-1">
                <span className="font-bold">Invoice #:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
            </div>
          </div>

          {/* Sale Invoice Reference */}
          <div className="text-center mb-6">
            <span className="text-sm">Sale Invoice {invoice.invoiceNumber}</span>
          </div>

          {/* Shipping Info Row */}
          <div className="mb-6">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="text-left py-1 px-2 font-semibold text-gray-600 w-1/4">Shipping Route</th>
                  <th className="text-left py-1 px-2 font-semibold text-gray-600 w-1/4">Shipping Term</th>
                  <th className="text-left py-1 px-2 font-semibold text-gray-600 w-1/4">Shipper</th>
                  <th className="text-left py-1 px-2 font-semibold text-gray-600 w-1/4">Specs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 px-2">DXB-NL</td>
                  <td className="py-1 px-2">CIF NL</td>
                  <td className="py-1 px-2">DXB</td>
                  <td className="py-1 px-2">Modified</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="text-left py-2 px-2 font-semibold text-gray-600" style={{ width: '35%' }}>Phone Model</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600" style={{ width: '15%' }}>Color</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600" style={{ width: '10%' }}>Qty</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600" style={{ width: '13%' }}>Delivery 1</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600" style={{ width: '13%' }}>Delivery 2</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600" style={{ width: '14%' }}>Delivery 3</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 px-2">
                      {item.productName} {item.specs ? `${item.specs}` : ''}
                    </td>
                    <td className="py-2 px-2 text-center">{item.color || ''}</td>
                    <td className="py-2 px-2 text-center">{item.quantity}</td>
                    <td className="py-2 px-2 text-center"></td>
                    <td className="py-2 px-2 text-center"></td>
                    <td className="py-2 px-2 text-center"></td>
                  </tr>
                ))}
                {/* Empty rows */}
                {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-gray-200">
                    <td className="py-2 px-2">&nbsp;</td>
                    <td className="py-2 px-2">&nbsp;</td>
                    <td className="py-2 px-2">&nbsp;</td>
                    <td className="py-2 px-2">&nbsp;</td>
                    <td className="py-2 px-2">&nbsp;</td>
                    <td className="py-2 px-2">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-400 font-bold">
                  <td className="py-2 px-2">TOTAL</td>
                  <td className="py-2 px-2 text-center"></td>
                  <td className="py-2 px-2 text-center">{totalQty}</td>
                  <td className="py-2 px-2 text-center">0</td>
                  <td className="py-2 px-2 text-center">0</td>
                  <td className="py-2 px-2 text-center">0</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Note Section */}
          <div className="mt-8">
            <p className="text-sm font-semibold mb-2">Note:</p>
            <div className="text-sm" style={{ color: '#c65911' }}>
              <p className="italic">Original LCD</p>
              <p className="italic">Software above 15.01</p>
              <p className="italic">Battery should be New</p>
              <p className="italic">No Motherboard repaired</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" className="btn-accent-gradient" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
  }

  // NFB Trading Format
  if (isNFBTemplate) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="invoice-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.invoiceNumber}</span>
            <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="invoice-description">
            NFB Trading invoice preview and download options
          </DialogDescription>
        </DialogHeader>

        {/* NFB Trading Invoice Preview */}
        <div ref={invoiceRef} className="bg-white text-black rounded-lg p-6 text-sm">
          {/* Header with Logo */}
          <div className="flex justify-between items-start mb-4">
            <img src={nfbLogo} alt="NFB Trading Ltd" className="h-16 object-contain" />
            <h1 className="text-xl font-bold text-gray-800">Sales Invoice</h1>
          </div>

          {/* Date and Invoice Number Row */}
          <div className="flex justify-between mb-4 border-b border-gray-300 pb-2">
            <div>
              <span className="font-semibold">Date:</span> {format(invoice.createdAt, 'dd/MM/yyyy')}
            </div>
            <div>
              <span className="font-semibold">Invoice #:</span> {invoice.invoiceNumber}
            </div>
          </div>

          {/* From / Bill To / Ship To - Three Columns */}
          <div className="grid grid-cols-3 gap-0 mb-4 border border-gray-300">
            {/* From (Seller - Left Column) */}
            <div className="p-3 border-r border-gray-300">
              <p className="font-semibold text-gray-600 mb-2">From:</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Name:</span> {invoice.seller?.companyName || invoice.seller?.name || ''}</p>
                <p><span className="font-medium">Address:</span> {invoice.seller?.address || ''}</p>
                <p><span className="font-medium">Contact Person:</span> {invoice.seller?.name || ''}</p>
                <p><span className="font-medium">Contact #:</span> {invoice.seller?.phone || ''}</p>
                <p><span className="font-medium">VAT:</span> {invoice.seller?.vatNumber || ''}</p>
                <p><span className="font-medium">Email:</span> {invoice.seller?.email || ''}</p>
              </div>
            </div>

            {/* Bill To (Customer - Middle Column) */}
            <div className="p-3 border-r border-gray-300">
              <p className="font-semibold text-gray-600 mb-2">Bill To:</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Name:</span> {invoice.customer?.companyName || invoice.customer?.name || ''}</p>
                <p><span className="font-medium">Address:</span> {invoice.billingAddress || ''}</p>
                <p><span className="font-medium">Contact Person:</span> {invoice.customer?.name || ''}</p>
                <p><span className="font-medium">Contact #:</span> {invoice.customer?.phone || ''}</p>
                <p><span className="font-medium">VAT:</span> {invoice.customer?.vatNumber || ''}</p>
                <p><span className="font-medium">Email:</span> {invoice.customer?.email || ''}</p>
              </div>
            </div>

            {/* Ship To (Right Column) */}
            <div className="p-3">
              <p className="font-semibold text-gray-600 mb-2">Ship To:</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Name:</span> {invoice.customer?.companyName || invoice.customer?.name || ''}</p>
                <p><span className="font-medium">Address:</span> {invoice.shippingAddress || invoice.billingAddress || ''}</p>
                <p><span className="font-medium">Contact Person:</span> {invoice.customer?.name || ''}</p>
                <p><span className="font-medium">Contact #:</span> {invoice.customer?.phone || ''}</p>
              </div>
            </div>
          </div>

          {/* Shipping Terms and Currency Row */}
          <div className="grid grid-cols-2 gap-0 mb-4 border border-gray-300">
            <div className="p-2 border-r border-gray-300">
              <span className="font-semibold">Shipping Terms:</span> {invoice.shippingAddress ? 'Delivery' : 'Pickup'}
            </div>
            <div className="p-2">
              <span className="font-semibold">Currency:</span> EUR (€)
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-300 mb-4">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold border-b border-gray-300">Phone Model</th>
                  <th className="text-center py-2 px-3 font-semibold border-b border-gray-300">Color</th>
                  <th className="text-center py-2 px-3 font-semibold border-b border-gray-300">Qty</th>
                  <th className="text-right py-2 px-3 font-semibold border-b border-gray-300">Unit Price</th>
                  <th className="text-right py-2 px-3 font-semibold border-b border-gray-300">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-3">
                    {item.productName} {item.specs ? `(${item.specs})` : ''}
                  </td>
                  <td className="py-2 px-3 text-center">{item.color || '-'}</td>
                  <td className="py-2 px-3 text-center">{item.quantity}</td>
                  <td className="py-2 px-3 text-right">€ {item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">€ {item.lineTotal.toLocaleString()}</td>
                </tr>)}
                {/* Empty rows to match format */}
                {Array.from({
                  length: Math.max(0, 5 - invoice.items.length)
                }).map((_, i) => <tr key={`empty-${i}`} className="border-b border-gray-200">
                  <td className="py-2 px-3">&nbsp;</td>
                  <td className="py-2 px-3">&nbsp;</td>
                  <td className="py-2 px-3">&nbsp;</td>
                  <td className="py-2 px-3">&nbsp;</td>
                  <td className="py-2 px-3">&nbsp;</td>
                </tr>)}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="border-t border-gray-300">
                  <td className="py-2 px-3 font-semibold">QTY Total:</td>
                  <td className="py-2 px-3 text-center font-bold">{totalQty}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Totals and Bank Details Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Bank Details (Left) */}
            <div className="border border-gray-300 p-3 text-xs">
              <p className="font-semibold mb-2">Bank Details:</p>
              <div className="space-y-1">
                <p><span className="font-medium">Beneficiary name:</span> {invoice.bankAccount?.accountTitle || ''}</p>
                <p><span className="font-medium">IBAN:</span> {invoice.bankAccount?.iban || ''}</p>
                <p><span className="font-medium">Swift Code:</span> {invoice.bankAccount?.swift || ''}</p>
                <p><span className="font-medium">Bank Name:</span> {invoice.bankAccount?.bankName || ''}</p>
              </div>
            </div>

            {/* Totals (Right) */}
            <div className="border border-gray-300 p-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Sub Total:</span>
                  <span>€ {invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Discount:</span>
                  <span>€ {(invoice.discount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Shipping:</span>
                  <span>€ {invoice.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-2">
                  <span>Total:</span>
                  <span>€ {invoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="border-t border-gray-300 pt-3 text-xs text-gray-600 space-y-2">
            <p><span className="font-medium">Note:</span> 60 Day warranty for Phones. Price in Euro.</p>
            <p className="text-center mt-4 text-gray-500">
              To Claim Items Under RMA, NO Phone Should be Opened With Any Reason!
            </p>
            <p className="text-center font-medium text-gray-700">Thank you for your business!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" className="btn-accent-gradient" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
  }

  // JSP Template - JASPELENDARIO UNIPESSOAL LDA - PIXEL PERFECT
  if (isJSPTemplate) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="jsp-invoice-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.invoiceNumber}</span>
            <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="jsp-invoice-description">
            JSP invoice preview and download options
          </DialogDescription>
        </DialogHeader>

        {/* JSP Invoice Preview - EXACT Match to PDF */}
        <div ref={invoiceRef} className="bg-white text-black p-8" style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px'
        }}>

          {/* Header Row - Company Name left, INVOICE + Logo right */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold tracking-wide" style={{
                color: '#333',
                letterSpacing: '0.5px'
              }}>
                JASPELENDARIO UNIPESSOAL LDA
              </h1>
              <div style={{
                fontSize: '11px',
                color: '#555'
              }} className="mt-1 space-y-0">
                <p>R STARA- ZAGORA 23, 2830-364, UNIAO</p>
                <p>FREGUESIAS BARREIRO</p>
                <p style={{
                  color: '#1e4e79',
                  textDecoration: 'underline'
                }}>www.jaspelendario.com</p>
                <p className="mt-1">VAT: PT 518431738</p>
              </div>
            </div>
            {/* INVOICE text and Logo side by side */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold" style={{
                  color: '#4a5568'
                }}>
                  INVOICE
                </h2>
                <img src={jspLogo} alt="JsP Logo" className="h-14 object-contain" />
              </div>
            </div>
          </div>

          {/* Three Column Layout: BILL TO | SHIP TO | Invoice Details */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Bill To */}
            <div>
              <div className="pb-1 mb-2" style={{
                borderBottom: '2px solid #1e4e79'
              }}>
                <h3 className="font-bold text-xs" style={{
                  color: '#1e4e79'
                }}>BILL TO</h3>
              </div>
              <div style={{
                fontSize: '11px'
              }} className="space-y-0.5">
                <p>Company name :</p>
                <p className="pl-0">{invoice.customer?.companyName || ''}</p>
                <p className="mt-1">Address:</p>
                <p className="pl-0">{invoice.billingAddress || ''}</p>
                <p className="mt-1">Phone:</p>
                <p className="pl-0">{invoice.customer?.phone || ''}</p>
                <p className="mt-1">Contact Person:</p>
                <p className="pl-0">{invoice.customer?.name || ''}</p>
                <p className="mt-1">Vat number:</p>
                <p className="pl-0">{invoice.customer?.vatNumber || ''}</p>
                <p className="mt-1">Email:</p>
                <p className="pl-0">{invoice.customer?.email || ''}</p>
              </div>
            </div>

            {/* Ship To */}
            <div>
              <div className="pb-1 mb-2" style={{
                borderBottom: '2px solid #666'
              }}>
                <h3 className="font-bold text-xs" style={{
                  color: '#666'
                }}>SHIP TO</h3>
              </div>
              <div style={{
                fontSize: '11px'
              }} className="space-y-0.5">
                <p>Company name :</p>
                <p className="pl-0">{invoice.customer?.companyName || ''}</p>
                <p className="mt-1">Address:</p>
                <p className="pl-0">{invoice.shippingAddress || ''}</p>
                <p className="mt-1">Phone:</p>
                <p className="pl-0">{invoice.customer?.phone || ''}</p>
                <p className="mt-1">Contact Person:</p>
                <p className="pl-0">{invoice.customer?.name || ''}</p>
                <p className="mt-1">Vat number:</p>
                <p className="pl-0">{invoice.customer?.vatNumber || ''}</p>
                <p className="mt-1">Email:</p>
                <p className="pl-0">{invoice.customer?.email || ''}</p>
              </div>
            </div>

            {/* Invoice No & Date */}
            <div style={{
              fontSize: '12px'
            }}>
              <p className="mb-2"><span className="font-bold">Invoice No:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-bold">Date:</span> {format(invoice.createdAt, 'dd/MM/yyyy')}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <table className="w-full border-collapse" style={{
              fontSize: '11px'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#4a5568',
                  color: 'white'
                }}>
                  <th className="text-center py-2 px-3 font-semibold" style={{
                    width: '50%',
                    border: '1px solid #4a5568'
                  }}>DESCRIPTION</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{
                    width: '12%',
                    border: '1px solid #4a5568'
                  }}>QTY</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{
                    width: '19%',
                    border: '1px solid #4a5568'
                  }}>UNIT PRICE</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{
                    width: '19%',
                    border: '1px solid #4a5568'
                  }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => <tr key={index}>
                  <td className="py-1.5 px-3 border border-gray-300">
                    {item.productName} {item.specs ? `(${item.specs})` : ''} {item.color ? `- ${item.color}` : ''}
                  </td>
                  <td className="py-1.5 px-3 text-center border border-gray-300">{item.quantity}</td>
                  <td className="py-1.5 px-3 text-center border border-gray-300">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">{item.lineTotal.toFixed(2)}</td>
                </tr>)}
                {/* Empty rows to fill 3 minimum */}
                {Array.from({
                  length: Math.max(0, 3 - invoice.items.length)
                }).map((_, i) => <tr key={`empty-${i}`}>
                  <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                  <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                  <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">0.00</td>
                </tr>)}
                {/* SUBTOTAL row */}
                <tr>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 text-right border border-gray-300 font-semibold">
                  </td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">{invoice.subtotal.toFixed(2)}</td>
                </tr>
                {/* DISCOUNT row */}
                <tr>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">
                  </td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">{(invoice.discount || 0).toFixed(2)}</td>
                </tr>
                {/* SUBTOTAL LESS DISCOUNT row */}
                <tr>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 border border-gray-300"></td>
                  <td className="py-1.5 px-3 text-right border border-gray-300 font-semibold">
                  </td>
                  <td className="py-1.5 px-3 text-right border border-gray-300">{(invoice.subtotal - (invoice.discount || 0)).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Thank You Message and Tax Section - Side by Side */}
          <div className="flex justify-between items-start mb-6">
            {/* Thank you on left */}
            <div style={{
              fontSize: '12px'
            }} className="font-medium text-gray-700 mt-4">
              <p>Thank you for your business!</p>
            </div>

            {/* Tax section on right - separate from table */}
            <div style={{
              fontSize: '11px'
            }}>
              <table className="border-collapse">
                <tbody>
                  <tr>
                    <td className="py-1 px-3 text-right border border-gray-300 font-bold">SUBTOTAL</td>
                    <td className="py-1 px-3 text-right border border-gray-300">{invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3 text-right border border-gray-300">Discount</td>
                    <td className="py-1 px-3 text-right border border-gray-300">{(invoice.discount || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3 text-right border border-gray-300 font-bold">SUBTOTAL LESS DISCOUNT</td>
                    <td className="py-1 px-3 text-right border border-gray-300">{(invoice.subtotal - (invoice.discount || 0)).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              {/* Balance Due - in a box */}
              <div className="flex justify-between items-center mt-3 p-2" style={{
                border: '2px solid #333'
              }}>
                <span className="font-bold" style={{
                  color: '#c65911'
                }}>Balance Due</span>
                <span className="font-bold text-base ml-6" style={{
                  color: '#c65911'
                }}>€ {invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Instructions */}
          <div className="mb-4">
            <p className="font-bold text-sm mb-1" style={{
              textDecoration: 'underline'
            }}>Terms & Instructions</p>
            <p style={{
              fontSize: '11px'
            }}>goods are sold under marginal Vat scheme</p>
          </div>

          {/* Bank Details - no header, just fields */}
          <div style={{
            fontSize: '11px'
          }} className="space-y-0.5">
            <p>IBAN: {invoice.bankAccount?.iban || ''}</p>
            <p>Swift: {invoice.bankAccount?.swift || ''}</p>
            <p>Account Title: {invoice.bankAccount?.accountTitle || ''}</p>
            <p>Bank Name: {invoice.bankAccount?.bankName || ''}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" className="btn-accent-gradient" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
  }

  // Teletek Template - EXACT match to original PDF format
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="teletek-invoice-description">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Invoice {invoice.invoiceNumber}</span>
          <Badge variant="outline" className={cn('capitalize', statusStyles[invoice.status])}>
            {invoice.status}
          </Badge>
        </DialogTitle>
        <DialogDescription id="teletek-invoice-description">
          Teletek invoice preview and download options
        </DialogDescription>
      </DialogHeader>

      {/* Teletek Invoice Preview - PIXEL PERFECT Match */}
      <div ref={invoiceRef} className="bg-white text-black p-8" style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px'
      }}>

        {/* Header Row - Company Name, INVOICE, TT Logo */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-baseline gap-16">
            <h1 className="text-lg font-normal tracking-wide" style={{
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0.5px',
              color: '#333'
            }}>
              TELETEK TECHNAHH BV
            </h1>
            <h2 className="text-lg font-bold" style={{
              fontFamily: 'Arial, sans-serif',
              color: '#1e4e79'
            }}>
              INVOICE
            </h2>
          </div>
          <div className="text-7xl font-bold tracking-tight" style={{
            fontFamily: 'Arial Black, sans-serif',
            color: '#1e4e79'
          }}>
            TT
          </div>
        </div>

        {/* Invoice Details - Left aligned, Bold labels */}
        <div className="mb-8" style={{
          fontSize: '11px'
        }}>
          <p className="mb-1"><span className="font-bold">Invoice No:</span> {invoice.invoiceNumber}</p>
          <p className="mb-1"><span className="font-bold">Invoice Date:</span> {format(invoice.createdAt, 'dd/MM/yyyy')}</p>
          <p><span className="font-bold">Due Date:</span> {format(invoice.dueDate, 'dd/MM/yyyy')}</p>
        </div>

        {/* Bill To / Ship To Section - Side by Side */}
        <div className="grid grid-cols-2 gap-16 mb-8">
          {/* Bill To */}
          <div>
            <div className="pb-1 mb-3" style={{
              borderBottom: '1px solid #1e4e79'
            }}>
              <h3 className="font-bold text-xs" style={{
                color: '#1e4e79'
              }}>BILL TO</h3>
            </div>
            <div style={{
              fontSize: '11px'
            }} className="space-y-0.5">
              <p>Company name : {invoice.customer?.companyName || ''}</p>
              <p>Address: {invoice.billingAddress || ''}</p>
              <p>Phone: {invoice.customer?.phone || ''}</p>
              <p>Contact Person: {invoice.customer?.name || ''}</p>
              <p>Vat number: {invoice.customer?.vatNumber || ''}</p>
              <p>Email: {invoice.customer?.email || ''}</p>
            </div>
          </div>
          {/* Ship To */}
          <div>
            <div className="pb-1 mb-3" style={{
              borderBottom: '1px solid #666'
            }}>
              <h3 className="font-bold text-xs" style={{
                color: '#666'
              }}>SHIP TO</h3>
            </div>
            <div style={{
              fontSize: '11px'
            }} className="space-y-0.5">
              <p>Company name : {invoice.customer?.companyName || ''}</p>
              <p>Address: {invoice.shippingAddress || ''}</p>
              <p>Phone: {invoice.customer?.phone || ''}</p>
              <p>Contact Person: {invoice.customer?.name || ''}</p>
              <p>Vat number: {invoice.customer?.vatNumber || ''}</p>
              <p>Email: {invoice.customer?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <table className="w-full border-collapse" style={{
            fontSize: '11px'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#4a5568',
                color: 'white'
              }}>
                <th className="text-center py-2 px-3 font-semibold" style={{
                  width: '45%',
                  border: '1px solid #4a5568'
                }}>DESCRIPTION</th>
                <th className="text-center py-2 px-3 font-semibold" style={{
                  width: '15%',
                  border: '1px solid #4a5568'
                }}>QTY</th>
                <th className="text-center py-2 px-3 font-semibold" style={{
                  width: '20%',
                  border: '1px solid #4a5568'
                }}>UNIT PRICE</th>
                <th className="text-center py-2 px-3 font-semibold" style={{
                  width: '20%',
                  border: '1px solid #4a5568'
                }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => <tr key={index}>
                <td className="py-1.5 px-3 border border-gray-300">
                  {item.productName} {item.specs ? `(${item.specs})` : ''} {item.color ? `- ${item.color}` : ''}
                </td>
                <td className="py-1.5 px-3 text-center border border-gray-300">{item.quantity}</td>
                <td className="py-1.5 px-3 text-center border border-gray-300">{item.unitPrice.toFixed(2)}</td>
                <td className="py-1.5 px-3 text-right border border-gray-300">{item.lineTotal.toFixed(2)}</td>
              </tr>)}
              {/* Empty rows to fill 5 minimum */}
              {Array.from({
                length: Math.max(0, 5 - invoice.items.length)
              }).map((_, i) => <tr key={`empty-${i}`}>
                <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                <td className="py-1.5 px-3 border border-gray-300">&nbsp;</td>
                <td className="py-1.5 px-3 text-right border border-gray-300">0.00</td>
              </tr>)}
              {/* SUBTOTAL row */}
              <tr>
                <td className="py-1.5 px-3 border border-gray-300"></td>
                <td className="py-1.5 px-3 text-center border border-gray-300 font-bold">{totalQty}</td>
                <td className="py-1.5 px-3 text-right border border-gray-300 font-semibold">
                </td>
                <td className="py-1.5 px-3 text-right border border-gray-300">{invoice.subtotal.toFixed(2)}</td>
              </tr>
              {/* Discount row */}
              <tr>
                <td className="py-1.5 px-3 border border-gray-300"></td>
                <td className="py-1.5 px-3 border border-gray-300"></td>
                <td className="py-1.5 px-3 text-right border border-gray-300">
                </td>
                <td className="py-1.5 px-3 text-right border border-gray-300">{(invoice.discount || 0).toFixed(2)}</td>
              </tr>
              {/* SUBTOTAL LESS DISCOUNT row */}
              <tr>
                <td className="py-1.5 px-3 border border-gray-300"></td>
                <td className="py-1.5 px-3 border border-gray-300"></td>
                <td className="py-1.5 px-3 text-right border border-gray-300 font-semibold">
                </td>
                <td className="py-1.5 px-3 text-right border border-gray-300">{(invoice.subtotal - (invoice.discount || 0)).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Note and Tax Section - Side by Side */}
        <div className="flex justify-between items-start mb-6">
          {/* Note on left */}
          <div style={{
            fontSize: '12px',
            maxWidth: '55%'
          }} className="text-gray-700">
            <p>Note: Broken phone or Black Dot in LCD should be notified within 48 hours. After 48 Hours claim will not be valid</p>
          </div>

          {/* Tax section on right */}
          <div style={{
            fontSize: '11px'
          }}>
            <table className="border-collapse">
              <tbody>
                <tr>
                  <td className="py-1 px-3 text-right border border-gray-300 font-bold">SUBTOTAL</td>
                  <td className="py-1 px-3 text-right border border-gray-300">{invoice.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-1 px-3 text-right border border-gray-300">Discount</td>
                  <td className="py-1 px-3 text-right border border-gray-300">{(invoice.discount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-1 px-3 text-right border border-gray-300">Shipping</td>
                  <td className="py-1 px-3 text-right border border-gray-300">{(invoice.shipping || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-1 px-3 text-right border border-gray-300 font-bold">SUBTOTAL LESS DISCOUNT</td>
                  <td className="py-1 px-3 text-right border border-gray-300">{(invoice.subtotal - (invoice.discount || 0) + (invoice.shipping || 0)).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-1 px-3 text-right border border-gray-300 font-bold" style={{ color: '#c65911' }}>Balance Due</td>
                  <td className="py-1 px-3 text-right border border-gray-300 font-bold" style={{ color: '#c65911' }}>€ {invoice.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms & Instructions */}
        <div className="mb-4">
          <p className="font-bold text-sm mb-1" style={{
            textDecoration: 'underline'
          }}>Terms & Instructions</p>
          <p style={{
            fontSize: '11px'
          }}>GOODS ARE SOLD UNDER MARGINAL VAT SCHEME</p>
        </div>

        {/* Wire Instructions */}
        <div className="mb-8">
          <p className="font-bold text-sm mb-2" style={{
            textDecoration: 'underline'
          }}>WIRE INSTRUCTION</p>
          <div style={{
            fontSize: '11px'
          }} className="space-y-0.5">
            <p>Account Title: {invoice.bankAccount?.accountTitle || ''}</p>
            <p>IBAN: {invoice.bankAccount?.iban || ''}</p>
            <p>Swift: {invoice.bankAccount?.swift || ''}</p>
            <p>Bank: {invoice.bankAccount?.bankName || ''}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 pt-4" style={{
          fontSize: '10px'
        }}>
          <p>Aventurijn 260, 3316 LB, Dordrecht, T 0031685083170, KVK 83438165, VAT ID NL862874579B01</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button size="sm" className="btn-accent-gradient" onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </DialogContent>
  </Dialog>;
}