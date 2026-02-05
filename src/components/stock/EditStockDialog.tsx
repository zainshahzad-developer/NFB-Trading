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
import { Edit } from 'lucide-react';

interface EditStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSave: (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => void;
}

const categories = ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Wearables'];

export function EditStockDialog({ open, onOpenChange, product, onSave }: EditStockDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    specs: '',
    color: '',
    quantity: '',
    unitPrice: '',
    minStock: '',
    category: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        specs: product.specs,
        color: product.color,
        quantity: product.quantity.toString(),
        unitPrice: product.unitPrice.toString(),
        minStock: product.minStock.toString(),
        category: product.category,
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    onSave(product.id, {
      name: formData.name,
      specs: formData.specs,
      color: formData.color,
      quantity: parseInt(formData.quantity) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      minStock: parseInt(formData.minStock) || 10,
      category: formData.category,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Edit className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="iPhone 15 Pro Max"
                className="mt-1.5 input-focus"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-specs">Specs</Label>
              <Input
                id="edit-specs"
                value={formData.specs}
                onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                placeholder="256GB, A17 Pro chip"
                className="mt-1.5 input-focus"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Natural Titanium"
                className="mt-1.5 input-focus"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
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
              <Label htmlFor="edit-unitPrice">Unit Price (€)</Label>
              <Input
                id="edit-unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="1199.00"
                className="mt-1.5 input-focus"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-minStock">Min. Stock Level</Label>
              <Input
                id="edit-minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                placeholder="10"
                className="mt-1.5 input-focus"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
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
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-accent-gradient">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
