import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Mail, Phone, MapPin, MoreVertical, Building2, Store, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSellers } from '@/hooks/useSellers';
import { AddSellerDialog } from '@/components/sellers/AddSellerDialog';
import { EditSellerDialog } from '@/components/sellers/EditSellerDialog';
import { BankAccountsDialog } from '@/components/sellers/BankAccountsDialog';
import { Seller } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Sellers() {
  const { sellers, loading, refetch } = useSellers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [bankAccountsSeller, setBankAccountsSeller] = useState<Seller | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSellers = sellers.filter(seller =>
    seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seller?')) return;
    
    const { error } = await supabase.from('sellers').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete seller');
      return;
    }
    toast.success('Seller deleted successfully');
    refetch();
  };

  return (
    <MainLayout 
      title="Sellers" 
      subtitle="Manage your seller/company profiles"
    >
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 input-focus bg-card"
            />
          </div>
          <Button className="btn-accent-gradient gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Seller
          </Button>
        </div>

        <AddSellerDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={refetch}
        />

        <EditSellerDialog
          seller={editingSeller}
          open={!!editingSeller}
          onOpenChange={(open) => !open && setEditingSeller(null)}
          onSuccess={refetch}
        />

        <BankAccountsDialog
          open={!!bankAccountsSeller}
          onOpenChange={(open) => !open && setBankAccountsSeller(null)}
          sellerId={bankAccountsSeller?.id || ''}
          sellerName={bankAccountsSeller?.companyName || bankAccountsSeller?.name || ''}
        />

        {/* Seller Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50 overflow-hidden">
                <CardContent className="p-6">
                  <div className="h-32 rounded-lg bg-muted animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No sellers yet</h3>
            <p className="text-muted-foreground mb-6">Add your first seller/company profile to get started</p>
            <Button className="btn-accent-gradient gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Seller
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSellers.map((seller) => (
              <Card key={seller.id} className="card-hover border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-success/5 via-transparent to-primary/5 p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{seller.companyName || seller.name}</p>
                          <Badge className="bg-success/20 text-success border-success/30">
                            Active
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => setEditingSeller(seller)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBankAccountsSeller(seller)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Bank Accounts
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(seller.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="px-6 py-4 space-y-3">
                    {seller.name && seller.companyName && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span>Contact: {seller.name}</span>
                      </div>
                    )}
                    {seller.email && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="truncate">{seller.email}</span>
                      </div>
                    )}
                    {seller.phone && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span>{seller.phone}</span>
                      </div>
                    )}
                    {seller.address && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span>{seller.address}</span>
                      </div>
                    )}
                  </div>

                  {/* VAT Info Footer */}
                  <div className="px-6 pb-6">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground font-medium mb-1">VAT Number</p>
                        <p className="font-semibold text-primary">{seller.vatNumber || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
