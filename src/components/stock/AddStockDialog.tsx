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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/types';
import { Package, Info } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const categories = ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Wearables'];

export function AddStockDialog({ open, onOpenChange, onAdd }: AddStockDialogProps) {
  const { products } = useProducts();
  const [formData, setFormData] = useState({
    name: '',
    specs: '',
    color: '',
    quantity: '',
    unitPrice: '',
    minStock: '',
    category: '',
  });
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);

  // Check for existing product when name, specs, or color changes
  useEffect(() => {
    if (formData.name && formData.specs) {
      const existing = products.find(
        p => p.name.toLowerCase() === formData.name.toLowerCase() &&
             p.specs.toLowerCase() === formData.specs.toLowerCase() &&
             (formData.color ? p.color.toLowerCase() === formData.color.toLowerCase() : p.color === '')
      );
      setExistingProduct(existing || null);
    } else {
      setExistingProduct(null);
    }
  }, [formData.name, formData.specs, formData.color, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      name: formData.name,
      specs: formData.specs,
      color: formData.color,
      quantity: parseInt(formData.quantity) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      minStock: parseInt(formData.minStock) || 10,
      category: formData.category,
    });

    setFormData({
      name: '',
      specs: '',
      color: '',
      quantity: '',
      unitPrice: '',
      minStock: '',
      category: '',
    });
    setExistingProduct(null);
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your inventory
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Existing Product Notice */}
          {existingProduct && (
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-2">
              <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-accent">Product exists</p>
                <p className="text-sm text-muted-foreground">
                  This product already exists with {existingProduct.quantity} units in stock. 
                  Adding {formData.quantity || 0} more will result in {existingProduct.quantity + (parseInt(formData.quantity) || 0)} total units.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="iPhone 15 Pro Max"
                className="mt-1.5 input-focus"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="specs">Specs</Label>
              <Input
                id="specs"
                value={formData.specs}
                onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                placeholder="256GB, A17 Pro chip"
                className="mt-1.5 input-focus"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="color">Color <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Natural Titanium"
                className="mt-1.5 input-focus"
              />
            </div>
            
            <div>
              <Label htmlFor="quantity">
                Quantity {existingProduct && <span className="text-accent">(+{existingProduct.quantity} existing)</span>}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="50"
                className="mt-1.5 input-focus"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="unitPrice">Unit Price (€) <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0.00"
                className="mt-1.5 input-focus"
                disabled={!!existingProduct}
              />
              {existingProduct && (
                <p className="text-xs text-muted-foreground mt-1">
                  Using existing price: €{existingProduct.unitPrice}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="minStock">Min. Stock Level</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                placeholder="10"
                className="mt-1.5 input-focus"
                disabled={!!existingProduct}
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={!!existingProduct}
              >
                <SelectTrigger className="mt-1.5 input-focus">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {existingProduct && (
                <p className="text-xs text-muted-foreground mt-1">
                  Category: {existingProduct.category}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-accent-gradient">
              {existingProduct ? 'Add to Existing Stock' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
