import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { InvoiceItem } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { useSellers } from '@/hooks/useSellers';
import { useInvoices } from '@/hooks/useInvoices';
import { FileText, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePurchaseBillDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const BUYING_CURRENCIES = [
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
];

export function CreatePurchaseBillDialog({ open, onOpenChange, onSuccess }: CreatePurchaseBillDialogProps) {
    const { products, adjustStock } = useProducts();
    // We don't really use sellers for NFB buying internally potentially, OR we can default it.
    // Requirement: "Buyer is NFB Trading". This implies NFB is the entity BUYING.
    // The Seller is who we are buying FROM.
    const { sellers } = useSellers();
    const { createInvoice } = useInvoices();

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sellerId, setSellerId] = useState('');
    const [stockType, setStockType] = useState<'stock' | 'presale'>('stock');
    const [productSearch, setProductSearch] = useState('');

    // Item Input State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [buyingCurrency, setBuyingCurrency] = useState('USD');
    const [buyingRate, setBuyingRate] = useState('1.0'); // Exchange Rate
    const [buyingPriceOriginal, setBuyingPriceOriginal] = useState(''); // Price in buying currency

    const calculatedEuroPrice = useMemo(() => {
        const price = parseFloat(buyingPriceOriginal) || 0;
        const rate = parseFloat(buyingRate) || 1;
        // If rate is how many buying currency units = 1 Euro? Or 1 Buying Unit = X Euros?
        // Usually "Buying Rate" in these contexts means Exchange Rate.
        // Let's assume Rate is: 1 Buying Unit = X EUR.
        // E.g. 1 USD = 0.92 EUR.
        // So Price(EUR) = Price(Original) * Rate.
        return price * rate;
    }, [buyingPriceOriginal, buyingRate]);

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        const search = productSearch.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.specs?.toLowerCase().includes(search) ||
            p.color?.toLowerCase().includes(search)
        );
    }, [products, productSearch]);

    const addItem = () => {
        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const qty = parseInt(quantity) || 1;
        const priceOriginal = parseFloat(buyingPriceOriginal) || 0;
        const rate = parseFloat(buyingRate) || 1;
        const priceEuro = priceOriginal * rate;

        const newItem: InvoiceItem = {
            productId: product.id,
            productName: product.name,
            specs: product.specs,
            color: product.color,
            quantity: qty,
            unitPrice: priceEuro, // Main system uses EUR
            lineTotal: priceEuro * qty,
            buyingCurrency: buyingCurrency,
            buyingRate: rate, // Store the exchange rate
            buyingPriceOriginal: priceOriginal,
            exchangeRate: rate
        };

        setItems([...items, newItem]);

        // Reset inputs but keep currency/rate as they might be same for whole bill
        setSelectedProductId('');
        setQuantity('1');
        setBuyingPriceOriginal('');
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.lineTotal, 0);
    };

    const clearAll = () => {
        setItems([]);
        setInvoiceNumber('');
        setSellerId('');
        resetItemInputs();
    };

    const resetItemInputs = () => {
        setSelectedProductId('');
        setQuantity('1');
        setBuyingPriceOriginal('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setIsSubmitting(true);
        try {
            // Only adjust stock if stock type is 'stock', not 'presale'
            const shouldAdjustStock = stockType === 'stock' ? adjustStock : undefined;

            await createInvoice({
                invoiceNumber: invoiceNumber.trim() || `PB-${Date.now()}`,
                invoiceType: 'purchase',
                template: 'purchase-nfb', // Defaulting to NFB Purchase
                sellerId: sellerId || undefined,
                items: items,
                subtotal: calculateTotal(),
                tax: 0,
                discount: 0,
                shipping: 0,
                total: calculateTotal(),
                status: 'draft',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                notes: stockType === 'presale' ? 'Presale - Stock not adjusted' : undefined,
            }, shouldAdjustStock);

            toast.success('Purchase bill created successfully');
            onOpenChange(false);
            onSuccess?.();

            // Reset form
            clearAll();
        } catch (error) {
            console.error('Error creating purchase bill:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isItemValid = selectedProductId && quantity && buyingPriceOriginal;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Create Purchase Bill</DialogTitle>
                            <DialogDescription>
                                Buyer is NFB Trading. Select items and currency details.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="invoiceNumber">Bill Number (Optional)</Label>
                            <Input
                                id="invoiceNumber"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="PB-001 (auto-generated if empty)"
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label>Stock Type</Label>
                            <RadioGroup value={stockType} onValueChange={(value) => setStockType(value as 'stock' | 'presale')} className="flex gap-4 mt-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="stock" id="stock" />
                                    <Label htmlFor="stock" className="font-normal cursor-pointer">Add to Stock</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="presale" id="presale" />
                                    <Label htmlFor="presale" className="font-normal cursor-pointer">Presale</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Seller (Optional)</Label>
                            <Select value={sellerId} onValueChange={setSellerId}>
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue placeholder="Select who we bought from" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sellers.map((seller) => (
                                        <SelectItem key={seller.id} value={seller.id}>
                                            {seller.companyName || seller.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-card space-y-4">
                        <h3 className="font-semibold text-sm mb-2">Add Items</h3>

                        {/* Product Search */}
                        <div className="col-span-full">
                            <Input
                                placeholder="Search products by name, specs, or color..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-3">
                                <Label className="text-xs">Product</Label>
                                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredProducts.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2">
                                <Label className="text-xs">Currency</Label>
                                <Select value={buyingCurrency} onValueChange={setBuyingCurrency}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BUYING_CURRENCIES.map((curr) => (
                                            <SelectItem key={curr.code} value={curr.code}>
                                                {curr.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2">
                                <Label className="text-xs">Buying Rate (to EUR)</Label>
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        value={buyingRate}
                                        onChange={(e) => setBuyingRate(e.target.value)}
                                        className="mt-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mt-1 h-9 w-9 p-0"
                                        title="Check on XE.com"
                                        onClick={() => window.open(`https://www.xe.com/currencyconverter/convert/?Amount=1&From=${buyingCurrency}&To=EUR`, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 text-blue-600" />
                                    </Button>
                                </div>
                            </div>


                            <div className="col-span-2">
                                <Label className="text-xs">Price ({buyingCurrency})</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={buyingPriceOriginal}
                                    onChange={(e) => setBuyingPriceOriginal(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="col-span-1">
                                <Label className="text-xs">Qty</Label>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="col-span-2">
                                <Button
                                    type="button"
                                    onClick={addItem}
                                    className="w-full"
                                    disabled={!isItemValid}
                                >
                                    <Plus className="h-4 w-4" /> Add
                                </Button>
                            </div>
                        </div>

                        {/* Preview of Euro Calculation */}
                        <div className="text-xs text-muted-foreground text-right">
                            Calc: {buyingPriceOriginal || 0} {buyingCurrency} * {buyingRate} = <span className="font-bold text-foreground">€{calculatedEuroPrice.toFixed(2)}</span> /unit
                        </div>
                    </div>

                    {/* Items Table */}
                    {items.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Product / Specs</th>
                                        <th className="px-4 py-3 text-right font-medium">Qty</th>
                                        <th className="px-4 py-3 text-right font-medium">Buy Currency</th>
                                        <th className="px-4 py-3 text-right font-medium">Rate</th>
                                        <th className="px-4 py-3 text-right font-medium">Buy Price</th>
                                        <th className="px-4 py-3 text-right font-medium">Total (EUR)</th>
                                        <th className="w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.productName}</div>
                                                <div className="text-xs text-muted-foreground">{item.specs}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right">{item.buyingCurrency}</td>
                                            <td className="px-4 py-3 text-right">{item.buyingRate}</td>
                                            <td className="px-4 py-3 text-right">
                                                {item.buyingPriceOriginal?.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                €{item.lineTotal.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-muted/50 font-medium">
                                    <tr>
                                        <td colSpan={5} className="px-4 py-3 text-right">Total:</td>
                                        <td className="px-4 py-3 text-right">€{calculateTotal().toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between sm:justify-between">
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={clearAll} className="text-muted-foreground hover:text-destructive">
                                Clear All
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || items.length === 0} className="btn-primary-gradient">
                                {isSubmitting ? 'Creating...' : 'Create Purchase Bill'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
