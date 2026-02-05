import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  CreditCard, 
  Bell, 
  Bot,
  Save,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanyProfile {
  id: string;
  name: string;
  companyName: string;
  vatNumber: string;
  address: string;
  email: string;
  phone: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  swift: string;
}

const defaultProfile: CompanyProfile = {
  id: '',
  name: 'Default',
  companyName: '',
  vatNumber: '',
  address: '',
  email: '',
  phone: '',
  bankName: '',
  accountHolder: '',
  iban: '',
  swift: '',
};

export default function Settings() {
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([
    { ...defaultProfile, id: '1', name: 'NFB Trading LTD' },
    { ...defaultProfile, id: '2', name: 'TELETEK TECHNAHH BV' },
  ]);
  const [activeProfileId, setActiveProfileId] = useState('1');

  const activeProfile = companyProfiles.find(p => p.id === activeProfileId) || companyProfiles[0];

  const updateProfile = (field: keyof CompanyProfile, value: string) => {
    setCompanyProfiles(profiles =>
      profiles.map(p =>
        p.id === activeProfileId ? { ...p, [field]: value } : p
      )
    );
  };

  const addProfile = () => {
    const newId = Date.now().toString();
    setCompanyProfiles([
      ...companyProfiles,
      { ...defaultProfile, id: newId, name: `Company ${companyProfiles.length + 1}` }
    ]);
    setActiveProfileId(newId);
  };

  const deleteProfile = (id: string) => {
    if (companyProfiles.length <= 1) {
      toast.error('You must have at least one company profile');
      return;
    }
    setCompanyProfiles(profiles => profiles.filter(p => p.id !== id));
    if (activeProfileId === id) {
      setActiveProfileId(companyProfiles.find(p => p.id !== id)?.id || '');
    }
  };

  const handleSave = () => {
    // In a real app, this would save to the database
    localStorage.setItem('companyProfiles', JSON.stringify(companyProfiles));
    toast.success('Settings saved successfully');
  };

  useEffect(() => {
    const saved = localStorage.getItem('companyProfiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompanyProfiles(parsed);
          setActiveProfileId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse saved profiles');
      }
    }
  }, []);

  return (
    <MainLayout 
      title="Settings" 
      subtitle="Manage your account and application preferences"
    >
      <div className="max-w-4xl space-y-6">
        {/* Company Profiles Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Invoice Formats / Company Profiles</CardTitle>
                  <CardDescription>Manage multiple company profiles for different invoice formats</CardDescription>
                </div>
              </div>
              <Button onClick={addProfile} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {companyProfiles.map(profile => (
                <div key={profile.id} className="relative group">
                  <Button
                    variant={activeProfileId === profile.id ? 'default' : 'outline'}
                    onClick={() => setActiveProfileId(profile.id)}
                    className="pr-8"
                  >
                    {profile.name || 'Unnamed Profile'}
                  </Button>
                  {companyProfiles.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProfile(profile.id);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Details for: {activeProfile?.name || 'Selected Profile'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Profile Name</Label>
                <Input 
                  value={activeProfile?.name || ''} 
                  onChange={(e) => updateProfile('name', e.target.value)}
                  placeholder="e.g., NFB Trading LTD" 
                  className="mt-1.5 input-focus" 
                />
              </div>
              <div>
                <Label>Company Name</Label>
                <Input 
                  value={activeProfile?.companyName || ''} 
                  onChange={(e) => updateProfile('companyName', e.target.value)}
                  placeholder="Enter company name" 
                  className="mt-1.5 input-focus" 
                />
              </div>
              <div>
                <Label>VAT Number</Label>
                <Input 
                  value={activeProfile?.vatNumber || ''} 
                  onChange={(e) => updateProfile('vatNumber', e.target.value)}
                  placeholder="Enter VAT number" 
                  className="mt-1.5 input-focus" 
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={activeProfile?.phone || ''} 
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  placeholder="Enter phone number" 
                  className="mt-1.5 input-focus" 
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  value={activeProfile?.email || ''} 
                  onChange={(e) => updateProfile('email', e.target.value)}
                  placeholder="Enter email address" 
                  className="mt-1.5 input-focus" 
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Textarea 
                  value={activeProfile?.address || ''} 
                  onChange={(e) => updateProfile('address', e.target.value)}
                  placeholder="Enter business address" 
                  className="mt-1.5 input-focus min-h-[80px]" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Payment information for: {activeProfile?.name || 'Selected Profile'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input 
                  value={activeProfile?.bankName || ''} 
                  onChange={(e) => updateProfile('bankName', e.target.value)}
                  placeholder="Enter bank name" 
                  className="mt-1.5 input-focus" 
                />
              </div>
              <div>
                <Label>Account Holder</Label>
                <Input 
                  value={activeProfile?.accountHolder || ''} 
                  onChange={(e) => updateProfile('accountHolder', e.target.value)}
                  placeholder="Enter account holder name" 
                  className="mt-1.5 input-focus" 
                />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input 
                  value={activeProfile?.iban || ''} 
                  onChange={(e) => updateProfile('iban', e.target.value)}
                  placeholder="Enter IBAN" 
                  className="mt-1.5 input-focus" 
                />
              </div>
              <div>
                <Label>BIC/SWIFT</Label>
                <Input 
                  value={activeProfile?.swift || ''} 
                  onChange={(e) => updateProfile('swift', e.target.value)}
                  placeholder="Enter BIC/SWIFT code" 
                  className="mt-1.5 input-focus" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>Configure your AI assistant settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable AI Assistant</p>
                <p className="text-sm text-muted-foreground">Allow AI to manage stock and invoices</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-execute Actions</p>
                <p className="text-sm text-muted-foreground">AI can perform actions without confirmation</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Voice Commands</p>
                <p className="text-sm text-muted-foreground">Enable voice input for AI assistant</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Invoice Reminders</p>
                <p className="text-sm text-muted-foreground">Reminders for unpaid invoices</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Summary</p>
                <p className="text-sm text-muted-foreground">Receive daily sales summary email</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="btn-accent-gradient" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
