import { useState, useMemo } from 'react';
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
import { Invoice, InvoiceItem, Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { useSellers } from '@/hooks/useSellers';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCurrencyConverter, CURRENCIES } from '@/hooks/useCurrencyConverter';
import { FileText, Plus, Trash2, Edit2, AlertTriangle, Package, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { QuickPurchaseDialog } from './QuickPurchaseDialog';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) {
  const { products, adjustStock, getAvailableStock, refetch: refetchProducts } = useProducts();
  const { sellers } = useSellers();
  const { customers } = useCustomers();
  const { createInvoice } = useInvoices();
  const { bankAccounts, refetch: refetchBankAccounts } = useBankAccounts();
  const { getCurrencySymbol, convert, formatCurrency } = useCurrencyConverter();
  
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [template, setTemplate] = useState<'nfb-trading' | 'teletek' | 'jsp' | 'packing-nfb' | 'purchase-stock' | 'purchase-presale' | 'purchase-nfb' | 'purchase-teletek' | 'purchase-jsp'>('nfb-trading');
  const [purchaseSource, setPurchaseSource] = useState<'stock' | 'pre-sale'>('stock');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [shipping, setShipping] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [buyingRate, setBuyingRate] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editBuyingRate, setEditBuyingRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState('EUR');
  
  // Quick Purchase Dialog state
  const [quickPurchaseOpen, setQuickPurchaseOpen] = useState(false);
  const [quickPurchaseProduct, setQuickPurchaseProduct] = useState<Product | null>(null);
  const [quickPurchaseSuggestedQty, setQuickPurchaseSuggestedQty] = useState(1);

  // Calculate pending quantities for each product (items already added to invoice)
  const pendingQuantities = useMemo(() => {
    const pending: Record<string, number> = {};
    items.forEach(item => {
      pending[item.productId] = (pending[item.productId] || 0) + item.quantity;
    });
    return pending;
  }, [items]);

  // Get effective available stock (stock - pending for sales, unlimited for purchase)
  const getEffectiveStock = (productId: string): number => {
    // For purchase invoices, we can add unlimited (show current stock for reference)
    if (invoiceType === 'purchase') {
      return Number.MAX_SAFE_INTEGER;
    }
    const available = getAvailableStock(productId);
    const pending = pendingQuantities[productId] || 0;
    return available - pending;
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

  // Auto-select template and default bank account based on seller (sales invoices only)
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
      } else if (companyName.includes('jaspelendario') || companyName.includes('jsp')) {
        setTemplate('jsp');
      }
    }

    // Auto-select default bank account for this seller
    const sellerBankAccounts = bankAccounts.filter(ba => ba.sellerId === id);
    const defaultBankAccount = sellerBankAccounts.find(ba => ba.isDefault) || sellerBankAccounts[0];
    if (defaultBankAccount) {
      setBankAccountId(defaultBankAccount.id);
    } else {
      setBankAccountId('');
    }
  };

  // Purchase invoice template selector
  const [purchaseTemplate, setPurchaseTemplate] = useState<'generic' | 'nfb' | 'teletek' | 'jsp'>('generic');

  // Purchase invoice source and template drive the final template
  const handlePurchaseSourceChange = (value: 'stock' | 'pre-sale') => {
    setPurchaseSource(value);
    updatePurchaseTemplate(purchaseTemplate, value);
  };

  // Handle purchase template selection
  const handlePurchaseTemplateChange = (value: 'generic' | 'nfb' | 'teletek' | 'jsp') => {
    setPurchaseTemplate(value);
    updatePurchaseTemplate(value, purchaseSource);
  };

  // Update purchase template based on template selection and source
  const updatePurchaseTemplate = (templateValue: 'generic' | 'nfb' | 'teletek' | 'jsp', sourceValue: 'stock' | 'pre-sale') => {
    if (templateValue === 'nfb') {
      setTemplate('purchase-nfb');
    } else if (templateValue === 'teletek') {
      setTemplate('purchase-teletek');
    } else if (templateValue === 'jsp') {
      setTemplate('purchase-jsp');
    } else {
      // Generic template based on source
      setTemplate(sourceValue === 'stock' ? 'purchase-stock' : 'purchase-presale');
    }
  };

  // Open quick purchase dialog for a product
  const openQuickPurchase = (product: Product, suggestedQty: number = 1) => {
    setQuickPurchaseProduct(product);
    setQuickPurchaseSuggestedQty(suggestedQty);
    setQuickPurchaseOpen(true);
  };

  // Handle successful quick purchase - refresh products and optionally auto-add item
  const handleQuickPurchaseSuccess = async (productId: string, addedQuantity: number) => {
    await refetchProducts();
    
    // Auto-add the item to the invoice after successful purchase
    const product = products.find(p => p.id === productId);
    if (product && invoiceType === 'sales') {
      // Check if product already exists in items
      const existingItemIndex = items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item - add the suggested quantity that was needed
        const existingItem = items[existingItemIndex];
        const newQty = existingItem.quantity + quickPurchaseSuggestedQty;
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
        toast.success(`Updated ${product.name} quantity to ${newQty}`);
      } else {
        // Add new item with the suggested quantity
        const newItem: InvoiceItem = {
          productId: product.id,
          productName: product.name,
          specs: product.specs,
          color: product.color,
          quantity: quickPurchaseSuggestedQty,
          unitPrice: product.unitPrice,
          lineTotal: product.unitPrice * quickPurchaseSuggestedQty,
        };
        setItems([...items, newItem]);
        toast.success(`Added ${quickPurchaseSuggestedQty}x ${product.name} to invoice`);
      }
      
      // Clear the selection
      setSelectedProductId('');
      setQuantity('1');
    }
  };

  const addItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity) || 1;
    
    // For sales invoices, validate stock
    if (invoiceType === 'sales') {
      const effectiveStock = getEffectiveStock(selectedProductId);
      if (qty > effectiveStock) {
        const needed = qty - effectiveStock;
        toast.error(
          `Insufficient stock. Only ${effectiveStock} available.`,
          {
            action: {
              label: 'Add Purchase',
              onClick: () => openQuickPurchase(product, needed > 0 ? needed : qty),
            },
          }
        );
        return;
      }
    }

    // Check if product already exists in items
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const existingItem = items[existingItemIndex];
      const newQty = existingItem.quantity + qty;
      
      // Revalidate with new total for sales invoices
      if (invoiceType === 'sales' && newQty > getAvailableStock(selectedProductId)) {
        const available = getAvailableStock(selectedProductId);
        const needed = newQty - available;
        toast.error(
          `Cannot add more. Total would exceed available stock.`,
          {
            action: {
              label: 'Add Purchase',
              onClick: () => openQuickPurchase(product, needed),
            },
          }
        );
        return;
      }

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
      // Add new item
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        specs: product.specs,
        color: product.color,
        quantity: qty,
        unitPrice: product.unitPrice,
        lineTotal: product.unitPrice * qty,
        buyingRate: invoiceType === 'purchase' ? (parseFloat(buyingRate) || undefined) : undefined,
      };
      setItems([...items, newItem]);
    }

    setSelectedProductId('');
    setQuantity('1');
    setBuyingRate('');
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
    
    // For sales invoices, validate stock
    if (invoiceType === 'sales') {
      const availableStock = getAvailableStock(item.productId);
      const otherItemsQty = items
        .filter((_, i) => i !== index)
        .filter(i => i.productId === item.productId)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (newQty > availableStock - otherItemsQty) {
        toast.error(`Cannot exceed available stock (${availableStock - otherItemsQty} remaining)`);
        return;
      }
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
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  // Check for any stock issues (only for sales invoices)
  const stockIssues = useMemo(() => {
    if (invoiceType === 'purchase') return []; // No stock issues for purchase
    const issues: string[] = [];
    items.forEach(item => {
      const available = getAvailableStock(item.productId);
      if (item.quantity > available) {
        issues.push(`${item.productName}: Need ${item.quantity}, only ${available} available`);
      }
    });
    return issues;
  }, [items, getAvailableStock, invoiceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (invoiceType === 'sales' && stockIssues.length > 0) {
      toast.error('Cannot create invoice: Insufficient stock for some items');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const selectedSeller = sellers.find(s => s.id === sellerId);
      const selectedCustomer = customers.find(c => c.id === customerId);
      
      const prefix = invoiceType === 'purchase' ? 'PO' : 'INV';
      
      await createInvoice({
        invoiceNumber: invoiceNumber.trim() || `${prefix}-${Date.now()}`,
        invoiceType,
        template,
        sellerId: sellerId || undefined,
        seller: selectedSeller,
        customerId: customerId || undefined,
        customer: selectedCustomer,
        bankAccountId: bankAccountId || undefined,
        billingAddress,
        shippingAddress,
        items,
        subtotal,
        tax: 0,
        discount: discountAmount,
        shipping: shippingCost,
        total,
        status: 'draft',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }, adjustStock);

      // Reset form
      setInvoiceType('sales');
      setInvoiceNumber('');
      setSellerId('');
      setCustomerId('');
      setBankAccountId('');
      setBillingAddress('');
      setShippingAddress('');
      setShipping('0');
      setDiscount('0');
      setItems([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a {invoiceType === 'purchase' ? 'purchase order' : 'sales invoice'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Invoice Type Selection */}
          <div>
            <Label>Invoice Type</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setInvoiceType('sales');
                  // reset to a sensible default for sales
                  setTemplate('nfb-trading');
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  invoiceType === 'sales'
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <p className="font-semibold text-card-foreground">Sales Invoice</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deducts stock when created
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoiceType('purchase');
                  // default purchase template follows purchase source
                  setSellerId('');
                  handlePurchaseSourceChange(purchaseSource);
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  invoiceType === 'purchase'
                    ? 'border-success bg-success/10'
                    : 'border-border hover:border-success/50'
                }`}
              >
                <p className="font-semibold text-card-foreground">Purchase Invoice</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adds stock when created
                </p>
              </button>
            </div>
          </div>

          {/* Stock Issues Warning (only for sales) */}
          {invoiceType === 'sales' && stockIssues.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Insufficient Stock</p>
                  <ul className="text-sm text-destructive/80 mt-1 space-y-1">
                    {items.map((item, i) => {
                      const available = getAvailableStock(item.productId);
                      if (item.quantity <= available) return null;
                      const needed = item.quantity - available;
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <li key={i} className="flex items-center justify-between gap-2">
                          <span>• {item.productName}: Need {item.quantity}, only {available} available</span>
                          {product && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs border-success text-success hover:bg-success/10"
                              onClick={() => openQuickPurchase(product, needed)}
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Add {needed}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Number & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder={invoiceType === 'purchase' ? 'PO-001 (auto-generated if empty)' : 'INV-001 (auto-generated if empty)'}
                className="mt-1.5 input-focus"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1.5 input-focus">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{curr.symbol}</span>
                        <span>{curr.code}</span>
                        <span className="text-muted-foreground text-xs">- {curr.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Template Type (auto-selected based on seller for sales, based on source for purchase) */}
          {(invoiceType === 'sales' ? !!sellerId : true) && (
            <div>
              <Label>Template</Label>
              <div className="mt-2 p-4 rounded-xl border-2 border-accent bg-accent/5">
                <p className="font-semibold">
                  {template === 'nfb-trading' || template === 'packing-nfb' || template === 'purchase-nfb'
                    ? 'NFB Trading LTD'
                    : template === 'teletek' || template === 'purchase-teletek'
                    ? 'TELETEK TECHNAHH BV'
                    : template === 'jsp' || template === 'purchase-jsp'
                    ? 'JASPELENDARIO UNIPESSOAL LDA'
                    : template === 'purchase-stock'
                    ? 'Purchase Order (Stock) - Generic'
                    : template === 'purchase-presale'
                    ? 'Purchase Order (Pre-Sale) - Generic'
                    : 'Invoice Template'}
                  {invoiceType === 'purchase' && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({purchaseSource === 'stock' ? 'Stock Intake' : 'Pre-Sale'})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {template === 'nfb-trading'
                    ? 'Professional sales invoice format'
                    : template === 'packing-nfb'
                    ? 'Packing invoice format (no prices)'
                    : template === 'teletek'
                    ? 'Marginal VAT scheme format'
                    : template === 'jsp'
                    ? 'Marginal VAT scheme format (Portuguese)'
                    : template === 'purchase-nfb'
                    ? 'NFB Trading purchase order format'
                    : template === 'purchase-teletek'
                    ? 'Teletek purchase order format'
                    : template === 'purchase-jsp'
                    ? 'JSP purchase order format'
                    : template === 'purchase-stock'
                    ? 'Generic stock intake template (Green)'
                    : 'Generic pre-sale order template (Blue)'}
                </p>
                {/* NFB template variant selector */}
                {invoiceType === 'sales' && (template === 'nfb-trading' || template === 'packing-nfb') && (
                  <div className="mt-3 pt-3 border-t border-accent/20">
                    <Label className="text-xs">Invoice Type</Label>
                    <Select 
                      value={template} 
                      onValueChange={(v) => setTemplate(v as 'nfb-trading' | 'packing-nfb')}
                    >
                      <SelectTrigger className="mt-1.5 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nfb-trading">Sales Invoice</SelectItem>
                        <SelectItem value="packing-nfb">Packing Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seller/Source & Customer Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              {invoiceType === 'sales' ? (
                <div className="space-y-3">
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
                  {sellerId && (
                    <div>
                      <Label htmlFor="bankAccount">
                        <Building2 className="h-3.5 w-3.5 inline mr-1" />
                        Bank Account (for wire instructions)
                      </Label>
                      <Select value={bankAccountId} onValueChange={setBankAccountId}>
                        <SelectTrigger className="mt-1.5 input-focus">
                          <SelectValue placeholder="Select bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts
                            .filter(ba => ba.sellerId === sellerId)
                            .map((bank) => (
                              <SelectItem key={bank.id} value={bank.id}>
                                {bank.accountTitle} {bank.isDefault && '(Default)'}
                              </SelectItem>
                            ))}
                          {bankAccounts.filter(ba => ba.sellerId === sellerId).length === 0 && (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                              No bank accounts found for this seller.
                              <br />
                              Add bank accounts in Sellers settings.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="purchaseTemplateSelect">Invoice Template</Label>
                    <Select value={purchaseTemplate} onValueChange={(v) => handlePurchaseTemplateChange(v as 'generic' | 'nfb' | 'teletek' | 'jsp')}>
                      <SelectTrigger className="mt-1.5 input-focus">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nfb">NFB Trading LTD</SelectItem>
                        <SelectItem value="teletek">TELETEK TECHNAHH BV</SelectItem>
                        <SelectItem value="jsp">JASPELENDARIO UNIPESSOAL LDA</SelectItem>
                        <SelectItem value="generic">Generic Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="purchaseSource">Stock / Pre‑Sale</Label>
                    <Select value={purchaseSource} onValueChange={(v) => handlePurchaseSourceChange(v as 'stock' | 'pre-sale')}>
                      <SelectTrigger className="mt-1.5 input-focus">
                        <SelectValue placeholder="Choose source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock">Stock (adds to inventory)</SelectItem>
                        <SelectItem value="pre-sale">Pre‑Sale (reserved for customer)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="customer">
                Customer {invoiceType === 'purchase' && <span className="text-muted-foreground text-xs">(optional)</span>}
              </Label>
              <Select value={customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="mt-1.5 input-focus">
                  <SelectValue placeholder={invoiceType === 'purchase' ? 'Select customer (optional)' : 'Select customer'} />
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
              <Label htmlFor="billingAddress">
                Billing Address {invoiceType === 'purchase' && <span className="text-muted-foreground text-xs">(optional)</span>}
              </Label>
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
              <Label htmlFor="shippingAddress">
                Shipping Address {invoiceType === 'purchase' && <span className="text-muted-foreground text-xs">(optional)</span>}
              </Label>
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
                    const currentStock = getAvailableStock(product.id);
                    const effectiveStock = getEffectiveStock(product.id);
                    // For purchase, no stock limit; for sales, check effective stock
                    const isOutOfStock = invoiceType === 'sales' && effectiveStock <= 0;
                    return (
                      <SelectItem 
                        key={product.id} 
                        value={product.id}
                        className={isOutOfStock ? 'opacity-60' : ''}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{product.name} - {product.color}</span>
                          <Badge 
                            variant={isOutOfStock ? 'destructive' : currentStock <= product.minStock ? 'secondary' : 'outline'}
                            className="text-xs ml-2"
                          >
                            {isOutOfStock ? 'Out of stock' : `${currentStock} in stock`}
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
                max={invoiceType === 'sales' && selectedProductId ? getEffectiveStock(selectedProductId) : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 input-focus"
                placeholder="Qty"
              />
              {invoiceType === 'purchase' && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={buyingRate}
                  onChange={(e) => setBuyingRate(e.target.value)}
                  className="w-28 input-focus"
                  placeholder="Buy Rate €"
                />
              )}
              <Button 
                type="button" 
                variant="outline" 
                onClick={addItem}
                disabled={!selectedProductId || parseInt(quantity) < 1}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {selectedProductId && invoiceType === 'sales' && (
              <div className="flex items-center gap-3 mt-2 p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    getEffectiveStock(selectedProductId) <= 0 
                      ? 'bg-destructive' 
                      : getEffectiveStock(selectedProductId) <= 5 
                        ? 'bg-warning' 
                        : 'bg-success'
                  }`} />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{getEffectiveStock(selectedProductId)}</span> units available
                  </p>
                </div>
                {getEffectiveStock(selectedProductId) <= 10 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-success/50 text-success hover:bg-success/10 hover:border-success ml-auto"
                    onClick={() => {
                      const product = products.find(p => p.id === selectedProductId);
                      if (product) openQuickPurchase(product, parseInt(quantity) || 1);
                    }}
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Quick Add Stock
                  </Button>
                )}
              </div>
            )}

            {/* Items List */}
            {items.length > 0 && (
              <div className="mt-4 rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-center p-3 font-medium">{invoiceType === 'purchase' ? 'Current' : 'Stock'}</th>
                      <th className="text-center p-3 font-medium">Qty</th>
                      {invoiceType === 'purchase' && (
                        <th className="text-right p-3 font-medium">Buying Rate</th>
                      )}
                      <th className="text-right p-3 font-medium">Unit Price</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const availableStock = getAvailableStock(item.productId);
                      const hasStockIssue = invoiceType === 'sales' && item.quantity > availableStock;
                      return (
                        <tr key={index} className={`border-t border-border ${hasStockIssue ? 'bg-destructive/5' : ''}`}>
                          <td className="p-3">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.color}</p>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={hasStockIssue ? 'destructive' : 'outline'} className="text-xs">
                              {availableStock}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="1"
                              max={invoiceType === 'sales' ? availableStock : undefined}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                              className={`w-16 h-8 text-center mx-auto ${hasStockIssue ? 'border-destructive' : ''}`}
                            />
                          </td>
                          {invoiceType === 'purchase' && (
                            <td className="p-3 text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.buyingRate ?? ''}
                                onChange={(e) => {
                                  const newRate = parseFloat(e.target.value) || undefined;
                                  const updatedItems = items.map((itm, i) => 
                                    i === index ? { ...itm, buyingRate: newRate } : itm
                                  );
                                  setItems(updatedItems);
                                }}
                                className="w-24 h-8 text-right ml-auto"
                                placeholder="€"
                              />
                            </td>
                          )}
                          <td className="p-3 text-right">
                            {editingItemIndex === index ? (
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-24 h-8 text-right"
                                  onBlur={() => saveEditPrice(index)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveEditPrice(index)}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <span>{getCurrencySymbol(currency)}{item.unitPrice.toLocaleString()}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => startEditPrice(index)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">{getCurrencySymbol(currency)}{item.lineTotal.toLocaleString()}</td>
                          <td className="p-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30">
                    <tr className="border-t border-border">
                      <td className="p-3 font-medium">QTY Total:</td>
                      <td></td>
                      <td className="p-3 text-center font-bold">{totalQty}</td>
                      <td className="p-3 text-right font-semibold">Subtotal:</td>
                      <td className="p-3 text-right font-bold">{getCurrencySymbol(currency)}{subtotal.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Discount & Shipping Cost */}
          <div className="flex justify-end">
            <div className="w-72 space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{getCurrencySymbol(currency)}{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm">(-)Discount ({getCurrencySymbol(currency)})</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 h-8 text-right"
                />
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm">(+)Shipping ({getCurrencySymbol(currency)})</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  className="w-24 h-8 text-right"
                />
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{getCurrencySymbol(currency)}{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className={invoiceType === 'purchase' ? 'bg-success hover:bg-success/90' : 'btn-accent-gradient'} 
              disabled={items.length === 0 || (invoiceType === 'sales' && stockIssues.length > 0) || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : invoiceType === 'purchase' ? 'Create Purchase Invoice' : 'Create Sales Invoice'}
            </Button>
          </DialogFooter>
        </form>

        {/* Quick Purchase Dialog */}
        <QuickPurchaseDialog
          open={quickPurchaseOpen}
          onOpenChange={setQuickPurchaseOpen}
          product={quickPurchaseProduct}
          suggestedQuantity={quickPurchaseSuggestedQty}
          onSuccess={handleQuickPurchaseSuccess}
          autoAddToInvoice={invoiceType === 'sales'}
        />
      </DialogContent>
    </Dialog>
  );
}
