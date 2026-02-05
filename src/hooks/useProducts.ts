import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { toast } from 'sonner';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data.map(p => ({
        id: p.id,
        name: p.name,
        specs: p.specs,
        color: p.color,
        quantity: p.quantity,
        unitPrice: Number(p.unit_price),
        minStock: p.min_stock,
        category: p.category,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Check if a product with same name, specs, and color exists
  const findExistingProduct = (name: string, specs: string, color: string) => {
    return products.find(
      p => p.name.toLowerCase() === name.toLowerCase() &&
           p.specs.toLowerCase() === specs.toLowerCase() &&
           p.color.toLowerCase() === color.toLowerCase()
    );
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Check if product with same name, specs, and color exists
      const existingProduct = findExistingProduct(product.name, product.specs, product.color);

      if (existingProduct) {
        // Product exists - add to existing quantity
        const newQuantity = existingProduct.quantity + product.quantity;
        await updateProduct(existingProduct.id, { quantity: newQuantity });
        toast.success(`Stock added to existing product. New quantity: ${newQuantity}`);
        return existingProduct;
      }

      // Product doesn't exist - create new
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          specs: product.specs,
          color: product.color,
          quantity: product.quantity,
          unit_price: product.unitPrice,
          min_stock: product.minStock,
          category: product.category,
        })
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [{
        id: data.id,
        name: data.name,
        specs: data.specs,
        color: data.color,
        quantity: data.quantity,
        unitPrice: Number(data.unit_price),
        minStock: data.min_stock,
        category: data.category,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }, ...prev]);

      toast.success('Product added successfully');
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
      throw error;
    }
  };

  // Adjust stock quantity (positive for adding, negative for deducting)
  const adjustStock = async (productId: string, quantityChange: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const newQuantity = product.quantity + quantityChange;
    if (newQuantity < 0) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${Math.abs(quantityChange)}`);
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      ));
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  };

  // Deduct stock (wrapper for adjustStock with negative value)
  const deductStock = async (productId: string, quantity: number) => {
    await adjustStock(productId, -quantity);
  };

  // Get available stock for a product
  const getAvailableStock = (productId: string): number => {
    const product = products.find(p => p.id === productId);
    return product?.quantity ?? 0;
  };

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.specs !== undefined) dbUpdates.specs = updates.specs;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
      if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
      if (updates.category !== undefined) dbUpdates.category = updates.category;

      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === id ? {
        id: data.id,
        name: data.name,
        specs: data.specs,
        color: data.color,
        quantity: data.quantity,
        unitPrice: Number(data.unit_price),
        minStock: data.min_stock,
        category: data.category,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : p));

      toast.success('Product updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      throw error;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    deductStock,
    getAvailableStock,
    refetch: fetchProducts,
  };
}
