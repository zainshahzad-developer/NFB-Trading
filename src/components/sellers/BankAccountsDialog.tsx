import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, CreditCard, Building } from 'lucide-react';
import { useBankAccounts, BankAccount } from '@/hooks/useBankAccounts';
import { toast } from 'sonner';

interface BankAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  sellerName: string;
}

export function BankAccountsDialog({
  open,
  onOpenChange,
  sellerId,
  sellerName,
}: BankAccountsDialogProps) {
  const { bankAccounts, loading, createBankAccount, updateBankAccount, deleteBankAccount } = useBankAccounts(sellerId);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    accountTitle: '',
    iban: '',
    swift: '',
    bankName: '',
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      accountTitle: '',
      iban: '',
      swift: '',
      bankName: '',
      isDefault: false,
    });
    setIsAdding(false);
    setEditingAccount(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingAccount(null);
    setFormData({
      accountTitle: '',
      iban: '',
      swift: '',
      bankName: '',
      isDefault: bankAccounts.length === 0, // First account is default
    });
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setIsAdding(false);
    setFormData({
      accountTitle: account.accountTitle,
      iban: account.iban || '',
      swift: account.swift || '',
      bankName: account.bankName || '',
      isDefault: account.isDefault,
    });
  };

  const handleSubmit = async () => {
    if (!formData.accountTitle.trim() || !formData.bankName.trim()) {
      toast.error('Bank Name and Account Holder are required');
      return;
    }

    try {
      if (editingAccount) {
        await updateBankAccount(editingAccount.id, {
          accountTitle: formData.accountTitle,
          iban: formData.iban || undefined,
          swift: formData.swift || undefined,
          bankName: formData.bankName || undefined,
          isDefault: formData.isDefault,
        });
      } else {
        await createBankAccount({
          sellerId,
          accountTitle: formData.accountTitle,
          iban: formData.iban || undefined,
          swift: formData.swift || undefined,
          bankName: formData.bankName || undefined,
          isDefault: formData.isDefault,
        });
      }
      resetForm();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    await deleteBankAccount(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Accounts - {sellerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add/Edit Form */}
          {(isAdding || editingAccount) && (
            <Card className="border-primary/50">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="e.g., Bank of America"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountTitle">Account Holder *</Label>
                    <Input
                      id="accountTitle"
                      value={formData.accountTitle}
                      onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                      placeholder="e.g., NFB Trading LTD"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="e.g., GB82 WEST 1234 5698 7654 32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swift">BIC/SWIFT</Label>
                    <Input
                      id="swift"
                      value={formData.swift}
                      onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
                      placeholder="e.g., WESTGB2L"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                    />
                    <Label htmlFor="isDefault">Set as default account</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingAccount ? 'Update' : 'Add'} Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Accounts List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : bankAccounts.length === 0 && !isAdding ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No bank accounts added yet</p>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Bank Account
              </Button>
            </div>
          ) : (
            <>
              {!isAdding && !editingAccount && (
                <Button onClick={handleAdd} className="gap-2 w-full" variant="outline">
                  <Plus className="h-4 w-4" />
                  Add Bank Account
                </Button>
              )}

              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <Card 
                    key={account.id} 
                    className={`${editingAccount?.id === account.id ? 'border-primary' : 'border-border/50'}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{account.accountTitle}</p>
                            {account.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          {account.bankName && (
                            <p className="text-sm text-muted-foreground">{account.bankName}</p>
                          )}
                          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                            {account.iban && (
                              <span><strong>IBAN:</strong> {account.iban}</span>
                            )}
                            {account.swift && (
                              <span><strong>SWIFT:</strong> {account.swift}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(account)}
                            disabled={!!editingAccount || isAdding}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(account.id)}
                            className="text-destructive hover:text-destructive"
                            disabled={!!editingAccount || isAdding}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
