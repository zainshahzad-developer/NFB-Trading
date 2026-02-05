import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types';
import { Mail, Phone, MapPin, Building2, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ViewCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function ViewCustomerDialog({ customer, open, onOpenChange, onEdit }: ViewCustomerDialogProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-primary-foreground">
                {customer.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-xl">{customer.name}</p>
              <Badge className="bg-success/20 text-success border-success/30 mt-1">
                Active
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {customer.companyName && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="font-medium">{customer.companyName}</p>
              </div>
            </div>
          )}

          {customer.vatNumber && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VAT Number</p>
                <p className="font-medium">{customer.vatNumber}</p>
              </div>
            </div>
          )}

          {customer.email && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>
          )}

          {customer.phone && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
          )}

          {customer.billingAddress && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billing Address</p>
                <p className="font-medium">{customer.billingAddress}</p>
              </div>
            </div>
          )}

          {customer.shippingAddress && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shipping Address</p>
                <p className="font-medium">{customer.shippingAddress}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Customer Since</p>
              <p className="font-medium">{format(customer.createdAt, 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button className="btn-accent-gradient" onClick={onEdit}>
            Edit Customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
