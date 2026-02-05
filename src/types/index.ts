export interface Product {
  id: string;
  name: string;
  specs: string;
  color: string;
  quantity: number;
  unitPrice: number;
  minStock: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Seller {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  vatNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  companyName?: string;
  vatNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id?: string;
  productId: string;
  productName: string;
  specs: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  buyingRate?: number;
  buyingCurrency?: string;
  exchangeRate?: number;
  buyingPriceOriginal?: number;
}

export interface BankAccount {
  id: string;
  sellerId?: string;
  accountTitle: string;
  iban?: string;
  swift?: string;
  bankName?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'sales' | 'purchase';
  template: 'nfb-trading' | 'teletek' | 'jsp' | 'packing-nfb' | 'purchase-stock' | 'purchase-presale' | 'purchase-nfb' | 'purchase-teletek' | 'purchase-jsp';
  sellerId?: string;
  seller?: Seller;
  customerId?: string;
  customer?: Customer;
  bankAccountId?: string;
  bankAccount?: BankAccount;
  billingAddress?: string;
  shippingAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
}

export interface SalesReport {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingAmount: number;
  recentSales: Invoice[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type: 'invoice_created' | 'stock_added' | 'report_generated';
    data?: any;
  };
}

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalRevenue: number;
  pendingInvoices: number;
  todaySales: number;
  monthlyGrowth: number;
}
