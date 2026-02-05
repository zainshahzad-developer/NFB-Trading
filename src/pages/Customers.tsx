import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Mail, Phone, MapPin, MoreVertical, Crown, Sparkles, Users, Eye, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useCustomers } from '@/hooks/useCustomers';
import { AddCustomerDialog } from '@/components/customers/AddCustomerDialog';
import { ViewCustomerDialog } from '@/components/customers/ViewCustomerDialog';
import { EditCustomerDialog } from '@/components/customers/EditCustomerDialog';
import { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Customers() {
  const { customers, loading, refetch } = useCustomers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast.success('Customer deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'vip':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1">
            <Crown className="h-3 w-3" />
            VIP
          </Badge>
        );
      case 'new':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 gap-1">
            <Sparkles className="h-3 w-3" />
            New
          </Badge>
        );
      default:
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            Active
          </Badge>
        );
    }
  };

  return (
    <MainLayout 
      title="Customers" 
      subtitle="Manage your customer relationships"
    >
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-9 input-focus bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="btn-accent-gradient gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <AddCustomerDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={refetch}
        />

        <ViewCustomerDialog
          customer={selectedCustomer}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          onEdit={() => {
            setIsViewDialogOpen(false);
            setIsEditDialogOpen(true);
          }}
        />

        <EditCustomerDialog
          customer={selectedCustomer}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={refetch}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedCustomer?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomer}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Customer Grid */}
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
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try a different search term' : 'Add your first customer to get started'}
            </p>
            {!searchQuery && (
              <Button className="btn-accent-gradient gap-2" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="card-hover border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-primary/5 via-transparent to-warning/5 p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                          <span className="text-xl font-bold text-primary-foreground">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{customer.name}</p>
                          {getStatusBadge('active')}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(customer)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="px-6 py-4 space-y-3">
                    {customer.email && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.shippingAddress && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span>{customer.shippingAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Footer */}
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">0</p>
                        <p className="text-xs text-muted-foreground font-medium">Orders</p>
                      </div>
                      <div className="text-center border-l border-border/50">
                        <p className="text-2xl font-bold text-success">€0</p>
                        <p className="text-xs text-muted-foreground font-medium">Total Spent</p>
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
