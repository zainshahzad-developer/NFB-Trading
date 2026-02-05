import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddStockDialog } from './AddStockDialog';
import { EditStockDialog } from './EditStockDialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function StockTable() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.color.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (stockFilter) {
      case 'in-stock':
        return product.quantity > product.minStock;
      case 'low-stock':
        return product.quantity > 0 && product.quantity <= product.minStock;
      case 'out-of-stock':
        return product.quantity <= 0;
      default:
        return true;
    }
  });

  const handleAddProduct = async (newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addProduct(newProduct);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateProduct(id, updates);
  };

  const handleDeleteClick = async (id: string) => {
    setDeleteError(null);
    
    // Check if product is used in any invoices
    const { count, error } = await supabase
      .from('invoice_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);
    
    if (error) {
      toast.error('Failed to check product usage');
      return;
    }
    
    if (count && count > 0) {
      setDeleteError(`This product is used in ${count} invoice item(s) and cannot be deleted. You can set the quantity to 0 instead.`);
    }
    
    setDeleteProductId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProductId || deleteError) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(deleteProductId);
      setDeleteProductId(null);
      setDeleteError(null);
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteProductId(null);
    setDeleteError(null);
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity <= 0) return { label: 'Out of Stock', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    if (product.quantity <= product.minStock) return { label: 'Low Stock', className: 'bg-warning/10 text-warning border-warning/20' };
    return { label: 'In Stock', className: 'bg-success/10 text-success border-success/20' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 input-focus"
          />
        </div>
        <div className="flex gap-2">
          <Select value={stockFilter} onValueChange={(value: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock') => setStockFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddDialogOpen(true)} className="btn-accent-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold">Specs</TableHead>
              <TableHead className="font-semibold">Color</TableHead>
              <TableHead className="font-semibold text-right">Quantity</TableHead>
              <TableHead className="font-semibold text-right">Unit Price</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const status = getStockStatus(product);
              return (
                <TableRow key={product.id} className="table-row-hover">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.specs}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ 
                          backgroundColor: product.color.toLowerCase().includes('black') ? '#1a1a1a' :
                            product.color.toLowerCase().includes('titanium') ? '#8B8B8B' :
                            product.color.toLowerCase().includes('blue') ? '#4A90D9' :
                            product.color.toLowerCase().includes('pink') ? '#FFB6C1' :
                            product.color.toLowerCase().includes('silver') ? '#C0C0C0' :
                            product.color.toLowerCase().includes('obsidian') ? '#2C2C2C' :
                            '#E5E5E5'
                        }}
                      />
                      {product.color}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{product.quantity}</TableCell>
                  <TableCell className="text-right font-medium">€{product.unitPrice.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('capitalize', status.className)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditClick(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add Product Dialog */}
      <AddStockDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddProduct}
      />

      {/* Edit Product Dialog */}
      <EditStockDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        product={editingProduct}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={handleCloseDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteError && <AlertTriangle className="h-5 w-5 text-destructive" />}
              {deleteError ? 'Cannot Delete Product' : 'Delete Product'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-destructive">{deleteError}</span>
              ) : (
                'Are you sure you want to delete this product? This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteError && (
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Delete
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
