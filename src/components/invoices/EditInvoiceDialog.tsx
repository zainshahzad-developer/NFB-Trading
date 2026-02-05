import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Invoice, InvoiceItem } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { useSellers } from '@/hooks/useSellers';
import { useCustomers } from '@/hooks/useCustomers';
import { FileText, Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface EditInvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    updates: Partial<Omit<Invoice, 'id' | 'createdAt'>>,
    stockAdjustments: { productId: string; quantityChange: number }[]
  ) => Promise<void>;
}

export function EditInvoiceDialog({ invoice, open, onOpenChange, onSave }: EditInvoiceDialogProps) {
  const { products, getAvailableStock } = useProducts();
  const { sellers } = useSellers();
  const { customers } = useCustomers();
  
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [template, setTemplate] = useState<'nfb-trading' | 'teletek' | 'jsp' | 'packing-nfb' | 'purchase-stock' | 'purchase-presale' | 'purchase-nfb' | 'purchase-teletek' | 'purchase-jsp'>('nfb-trading');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shipping, setShipping] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [originalItems, setOriginalItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load invoice data when opened
  useEffect(() => {
    if (invoice && open) {
      setInvoiceType(invoice.invoiceType || 'sales');
      setTemplate(invoice.template);
      setInvoiceNumber(invoice.invoiceNumber);
      setSellerId(invoice.sellerId || '');
      setCustomerId(invoice.customerId || '');
      setBillingAddress(invoice.billingAddress || '');
      setShippingAddress(invoice.shippingAddress || '');
      setShipping(invoice.shipping.toString());
      setDiscount((invoice.discount || 0).toString());
      setItems([...invoice.items]);
      setOriginalItems([...invoice.items]);
    }
  }, [invoice, open]);

  // Calculate pending quantities for each product (items already added to invoice)
  const pendingQuantities = useMemo(() => {
    const pending: Record<string, number> = {};
    items.forEach(item => {
      pending[item.productId] = (pending[item.productId] || 0) + item.quantity;
    });
    return pending;
  }, [items]);

  // Get original quantities from invoice
  const originalQuantities = useMemo(() => {
    const original: Record<string, number> = {};
    originalItems.forEach(item => {
      original[item.productId] = (original[item.productId] || 0) + item.quantity;
    });
    return original;
  }, [originalItems]);

  // Get effective available stock (stock + original invoice qty - pending)
  const getEffectiveStock = (productId: string): number => {
    const available = getAvailableStock(productId);
    const original = originalQuantities[productId] || 0;
    const pending = pendingQuantities[productId] || 0;
    return available + original - pending;
  };

  // Get available stock for adding new items
  const getAvailableForAdd = (productId: string): number => {
    const available = getAvailableStock(productId);
    const original = originalQuantities[productId] || 0;
    const pending = pendingQuantities[productId] || 0;
    return available + original - pending;
  };

  // Auto-fill billing address when customer is selected
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const customer = customers.find(c => c.id === id);
    if (customer?.billingAddress) {
      setBillingAddress(customer.billingAddress);
    }
    if (customer?.shippingAddress) {
      setShippingAddress(customer.shippingAddress);
    }
  };

  // Auto-select template based on seller (sales invoices only)
  const handleSellerChange = (id: string) => {
    setSellerId(id);

    if (invoiceType !== 'sales') return;

    const seller = sellers.find(s => s.id === id);
    if (seller?.companyName) {
      const companyName = seller.companyName.toLowerCase();
      if (companyName.includes('teletek')) {
        setTemplate('teletek');
      } else if (companyName.includes('nfb')) {
        setTemplate('nfb-trading');
      }
    }
  };

  const addItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity) || 1;
    const effectiveStock = getAvailableForAdd(selectedProductId);

    // Validate stock (sales invoices only)
    if (invoiceType === 'sales' && qty > effectiveStock) {
      toast.error(`Insufficient stock. Only ${effectiveStock} available.`);
      return;
    }

    // Check if product already exists in items
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      const existingItem = items[existingItemIndex];
      const newQty = existingItem.quantity + qty;
      
      const updatedItems = items.map((item, i) => {
        if (i === existingItemIndex) {
          return {
            ...item,
            quantity: newQty,
            lineTotal: item.unitPrice * newQty,
          };
        }
        return item;
      });
      setItems(updatedItems);
      toast.success(`Updated quantity for ${product.name}`);
    } else {
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        specs: product.specs,
        color: product.color,
        quantity: qty,
        unitPrice: product.unitPrice,
        lineTotal: product.unitPrice * qty,
      };
      setItems([...items, newItem]);
    }

    setSelectedProductId('');
    setQuantity('1');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const startEditPrice = (index: number) => {
    setEditingItemIndex(index);
    setEditPrice(items[index].unitPrice.toString());
  };

  const saveEditPrice = (index: number) => {
    const newPrice = parseFloat(editPrice) || 0;
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          unitPrice: newPrice,
          lineTotal: newPrice * item.quantity,
        };
      }
      return item;
    });
    setItems(updatedItems);
    setEditingItemIndex(null);
    setEditPrice('');
  };

  const updateQuantity = (index: number, newQty: number) => {
    const item = items[index];
    const available = getAvailableStock(item.productId);
    const original = originalQuantities[item.productId] || 0;
    const otherItemsQty = items
      .filter((_, i) => i !== index)
      .filter(i => i.productId === item.productId)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (invoiceType === 'sales' && newQty > available + original - otherItemsQty) {
      toast.error(`Cannot exceed available stock (${available + original - otherItemsQty} remaining)`);
      return;
    }

    const updatedItems = items.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity: newQty,
          lineTotal: item.unitPrice * newQty,
        };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingCost = parseFloat(shipping) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount + shippingCost;

  // Calculate stock adjustments needed
  const calculateStockAdjustments = (): { productId: string; quantityChange: number }[] => {
    const adjustments: { productId: string; quantityChange: number }[] = [];
    
    // Get all product IDs from both original and new items
    const allProductIds = new Set([
      ...originalItems.map(i => i.productId),
      ...items.map(i => i.productId)
    ]);

    allProductIds.forEach(productId => {
      const originalQty = originalItems
        .filter(i => i.productId === productId)
        .reduce((sum, i) => sum + i.quantity, 0);
      const newQty = items
        .filter(i => i.productId === productId)
        .reduce((sum, i) => sum + i.quantity, 0);
      
      const diff = originalQty - newQty; // Positive = restore stock, negative = deduct stock
      if (diff !== 0) {
        adjustments.push({ productId, quantityChange: diff });
      }
    });

    return adjustments;
  };

  // Check for any stock issues
  const stockIssues = useMemo(() => {
    const issues: string[] = [];
    items.forEach(item => {
      const available = getAvailableStock(item.productId);
      const original = originalQuantities[item.productId] || 0;
      if (item.quantity > available + original) {
        issues.push(`${item.productName}: Need ${item.quantity}, only ${available + original} available`);
      }
    });
    return issues;
  }, [items, getAvailableStock, originalQuantities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice) return;
    
    if (stockIssues.length > 0) {
      toast.error('Cannot update invoice: Insufficient stock for some items');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const selectedSeller = sellers.find(s => s.id === sellerId);
      const selectedCustomer = customers.find(c => c.id === customerId);
      const stockAdjustments = calculateStockAdjustments();
      
      await onSave(invoice.id, {
        invoiceNumber: invoiceNumber.trim() || invoice.invoiceNumber,
        invoiceType,
        template,
        sellerId: sellerId || undefined,
        seller: selectedSeller,
        customerId: customerId || undefined,
        customer: selectedCustomer,
        billingAddress,
        shippingAddress,
        items,
        subtotal,
        tax: 0,
        discount: discountAmount,
        shipping: shippingCost,
        total,
      }, stockAdjustments);

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>
                Modify invoice details and items
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Stock Issues Warning */}
          {stockIssues.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Insufficient Stock</p>
                <ul className="text-sm text-destructive/80 mt-1">
                  {stockIssues.map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Invoice Number */}
          <div>
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-001"
              className="mt-1.5 input-focus"
            />
          </div>

          {/* Invoice Type (auto-selected based on seller) */}
          {sellerId && (
            <div>
              <Label>Invoice Type</Label>
              <div className="mt-2 p-4 rounded-xl border-2 border-accent bg-accent/5">
                <p className="font-semibold">
                  {template === 'nfb-trading' ? 'NFB Trading LTD' : 'TELETEK TECHNAHH BV'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {template === 'nfb-trading' 
                    ? 'Professional sales invoice format' 
                    : 'Marginal VAT scheme format'}
                </p>
              </div>
            </div>
          )}

          {/* Seller & Customer Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seller">Seller (determines Invoice Type)</Label>
              <Select value={sellerId} onValueChange={handleSellerChange}>
                <SelectTrigger className="mt-1.5 input-focus">
                  <SelectValue placeholder="Select seller" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.companyName || seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="mt-1.5 input-focus">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.email ? `(${customer.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Textarea
                id="billingAddress"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="123 Business Street, London, UK"
                className="mt-1.5 input-focus min-h-[80px]"
                required={invoiceType === 'sales'}
              />
            </div>
            <div>
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="456 Delivery Street, London, UK"
                className="mt-1.5 input-focus min-h-[80px]"
              />
            </div>
          </div>

          {/* Add Items */}
          <div>
            <Label>Invoice Items</Label>
            <div className="flex gap-2 mt-2">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="flex-1 input-focus">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => {
                    const effectiveStock = getAvailableForAdd(product.id);
                    const isOutOfStock = effectiveStock <= 0;
                    return (
                      <SelectItem 
                        key={product.id} 
                        value={product.id}
                        disabled={isOutOfStock}
                        className={isOutOfStock ? 'opacity-50' : ''}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{product.name} - {product.color}</span>
                          <Badge 
                            variant={isOutOfStock ? 'destructive' : effectiveStock <= product.minStock ? 'secondary' : 'outline'}
                            className="text-xs ml-2"
                          >
                            {effectiveStock} available
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="1"
                max={invoiceType === 'sales' && selectedProductId ? getAvailableForAdd(selectedProductId) : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 input-focus"
                placeholder={invoiceType === 'purchase' ? 'Qty (no limit)' : 'Qty'}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={addItem}
                disabled={!selectedProductId || parseInt(quantity) < 1}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {selectedProductId && (
              <p className="text-xs text-muted-foreground mt-1">
                Available: {getAvailableForAdd(selectedProductId)} units
              </p>
            )}

            {/* Items List */}
            {items.length > 0 && (
              <div className="mt-4 rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-center p-3 font-medium">Qty</th>
                      <th className="text-right p-3 font-medium">Unit Price</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="p-3">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.color}</p>
                        </td>
                        <td className="p-3 text-center">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-16 text-center input-focus mx-auto"
                          />
                        </td>
                        <td className="p-3 text-right">
                          {editingItemIndex === index ? (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-24 text-right input-focus"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    saveEditPrice(index);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => saveEditPrice(index)}
                              >
                                ✓
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditPrice(index)}
                              className="flex items-center gap-1 text-right hover:text-accent transition-colors ml-auto"
                            >
                              €{item.unitPrice.toFixed(2)}
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium">
                          €{item.lineTotal.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Discount & Shipping */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Discount (€)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="mt-1.5 input-focus w-32"
              />
            </div>
            <div>
              <Label htmlFor="shipping">Shipping Cost (€)</Label>
              <Input
                id="shipping"
                type="number"
                min="0"
                step="0.01"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                className="mt-1.5 input-focus w-32"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">(-)Discount</span>
              <span>€{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">(+)Shipping</span>
              <span>€{shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-accent-gradient"
              disabled={isSubmitting || items.length === 0 || stockIssues.length > 0}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
