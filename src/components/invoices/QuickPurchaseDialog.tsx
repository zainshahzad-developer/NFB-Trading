import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product, Seller } from '@/types';
import { useInvoices } from '@/hooks/useInvoices';
import { useProducts } from '@/hooks/useProducts';
import { useSellers } from '@/hooks/useSellers';
import { 
  Package, 
  Plus, 
  Minus, 
  Check, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Truck
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  suggestedQuantity?: number;
  onSuccess: (productId: string, addedQuantity: number) => void;
  autoAddToInvoice?: boolean;
}

export function QuickPurchaseDialog({
  open,
  onOpenChange,
  product,
  suggestedQuantity = 1,
  onSuccess,
  autoAddToInvoice = false,
}: QuickPurchaseDialogProps) {
  const { createInvoice } = useInvoices();
  const { adjustStock, refetch: refetchProducts } = useProducts();
  const { sellers } = useSellers();
  
  const [quantity, setQuantity] = useState(suggestedQuantity.toString());
  const [unitPrice, setUnitPrice] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form when dialog opens with new product
  useEffect(() => {
    if (open && product) {
      setQuantity(suggestedQuantity.toString());
      setUnitPrice(product.unitPrice.toString());
      setSellerId('');
      setNotes('');
      setIsSuccess(false);
    }
  }, [open, product, suggestedQuantity]);

  const incrementQuantity = () => {
    setQuantity((prev) => (parseInt(prev) + 1).toString());
  };

  const decrementQuantity = () => {
    const current = parseInt(quantity) || 1;
    if (current > 1) {
      setQuantity((current - 1).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const qty = parseInt(quantity) || 1;
    const price = parseFloat(unitPrice) || product.unitPrice;

    if (qty < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedSeller = sellers.find(s => s.id === sellerId);
      
      // Create a quick purchase invoice to track the stock addition
      await createInvoice(
        {
          invoiceNumber: `QP-${Date.now()}`,
          invoiceType: 'purchase',
          template: 'nfb-trading',
          sellerId: sellerId || undefined,
          seller: selectedSeller,
          items: [
            {
              productId: product.id,
              productName: product.name,
              specs: product.specs,
              color: product.color,
              quantity: qty,
              unitPrice: price,
              lineTotal: price * qty,
            },
          ],
          subtotal: price * qty,
          tax: 0,
          discount: 0,
          shipping: 0,
          total: price * qty,
          status: 'paid',
          dueDate: new Date(),
          billingAddress: notes ? `Notes: ${notes}` : undefined,
        },
        adjustStock
      );

      // Refresh products to get updated stock
      await refetchProducts();

      // Show success state briefly
      setIsSuccess(true);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />
          <span>Added {qty} units of {product.name}</span>
        </div>,
        {
          description: autoAddToInvoice 
            ? 'Stock updated. Item will be added to your invoice.' 
            : 'Stock has been updated successfully.',
        }
      );

      // Short delay for success animation
      setTimeout(() => {
        onSuccess(product.id, qty);
        onOpenChange(false);
      }, 500);
      
    } catch (error) {
      console.error('Error creating quick purchase:', error);
      toast.error('Failed to add stock. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  const qty = parseInt(quantity) || 0;
  const price = parseFloat(unitPrice) || product.unitPrice;
  const totalCost = price * qty;
  const newStockLevel = product.quantity + qty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-success/10 via-success/5 to-transparent p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center ring-2 ring-success/30">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <DialogTitle className="text-xl">Quick Stock Purchase</DialogTitle>
                <DialogDescription className="mt-0.5">
                  Add inventory without leaving your invoice
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-5">
          {/* Product Card */}
          <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-lg text-foreground">{product.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>{product.specs}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span>{product.color}</span>
                </div>
              </div>
              <Badge 
                variant={product.quantity <= product.minStock ? 'destructive' : 'secondary'}
                className="text-sm font-medium"
              >
                {product.quantity} in stock
              </Badge>
            </div>
            
            {/* Stock level indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current Stock Level</span>
                <span>Min: {product.minStock}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    product.quantity <= product.minStock 
                      ? 'bg-destructive' 
                      : product.quantity <= product.minStock * 2 
                        ? 'bg-warning' 
                        : 'bg-success'
                  }`}
                  style={{ 
                    width: `${Math.min((product.quantity / (product.minStock * 3)) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quantity to Add</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl shrink-0"
                onClick={decrementQuantity}
                disabled={parseInt(quantity) <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-center text-xl font-semibold h-11 input-focus"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl shrink-0"
                onClick={incrementQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Price and Seller Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quickPurchasePrice" className="text-sm font-medium">
                Unit Price (€)
              </Label>
              <Input
                id="quickPurchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="h-11 input-focus"
                placeholder={product.unitPrice.toString()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier</Label>
              <Select value={sellerId} onValueChange={setSellerId}>
                <SelectTrigger className="h-11 input-focus">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        {seller.companyName || seller.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="quickPurchaseNotes" className="text-sm font-medium flex items-center gap-2">
              Notes <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <Textarea
              id="quickPurchaseNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this purchase..."
              className="min-h-[60px] input-focus resize-none"
            />
          </div>

          {/* Summary Card */}
          <div className="p-4 bg-success/5 border border-success/20 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-success font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Purchase Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Total Cost</span>
                <p className="text-xl font-bold text-success">
                  €{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">New Stock Level</span>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-foreground">{newStockLevel}</p>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </div>
            </div>
            {autoAddToInvoice && (
              <div className="pt-2 border-t border-success/20">
                <p className="text-xs text-success flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3" />
                  Item will be automatically added to your invoice after purchase
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className={`flex-1 sm:flex-none bg-success hover:bg-success/90 text-success-foreground transition-all duration-300 ${
                isSuccess ? 'scale-105' : ''
              }`}
              disabled={!quantity || parseInt(quantity) < 1 || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin" />
                  Adding...
                </span>
              ) : isSuccess ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Added!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Stock
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
