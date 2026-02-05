import * as XLSX from 'xlsx';
import { Invoice, InvoiceItem } from '@/types';

interface ExcelInvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  billingAddress: string;
  shippingAddress: string;
  vatNumber: string;
  email: string;
  phone: string;
  shippingTerms: string;
  currency: string;
  items: {
    phoneModel: string;
    color: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subTotal: number;
  shipping: number;
  total: number;
}

export function useExcelInvoice() {
  const generateExcelTemplate = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Create the data structure for the Excel file
    const wsData: (string | number)[][] = [
      ['NFB INVOICE TEMPLATE'],
      [''],
      ['HEADER INFORMATION'],
      ['Invoice No', ''],
      ['Invoice Date', ''],
      ['Customer Name', ''],
      ['Billing Address', ''],
      ['Shipping Address', ''],
      ['VAT', ''],
      ['Email', ''],
      ['Phone', ''],
      ['Shipping Terms', ''],
      ['Currency', 'EUR'],
      [''],
      ['LINE ITEMS'],
      ['Phone Model', 'Color', 'Qty', 'Unit Price', 'Line Total'],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      [''],
      ['TOTALS'],
      ['Sub Total', ''],
      ['Shipping', ''],
      ['Total', ''],
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // A - Labels/Phone Model
      { wch: 15 }, // B - Values/Color
      { wch: 10 }, // C - Qty
      { wch: 12 }, // D - Unit Price
      { wch: 12 }, // E - Line Total
    ];
    
    XLSX.utils.book_append_sheet(wb, worksheet, 'Invoice');
    
    // Generate file and trigger download
    const fileName = `NFB_Invoice_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const parseExcelFile = (file: File): Promise<ExcelInvoiceData | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get the Invoice sheet
          const sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase() === 'invoice'
          ) || workbook.SheetNames[0];
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
          
          // Parse header information
          const getHeaderValue = (label: string): string => {
            const row = jsonData.find(r => 
              r[0]?.toString().toLowerCase().replace(/\s+/g, '') === label.toLowerCase().replace(/\s+/g, '')
            );
            return row ? (row[1]?.toString() || '') : '';
          };
          
          const invoiceNumber = getHeaderValue('Invoice No') || getHeaderValue('InvoiceNo');
          const invoiceDateStr = getHeaderValue('Invoice Date') || getHeaderValue('InvoiceDate');
          const customerName = getHeaderValue('Customer Name') || getHeaderValue('CustomerName');
          const billingAddress = getHeaderValue('Billing Address') || getHeaderValue('BillingAddress');
          const shippingAddress = getHeaderValue('Shipping Address') || getHeaderValue('ShippingAddress');
          const vatNumber = getHeaderValue('VAT');
          const email = getHeaderValue('Email');
          const phone = getHeaderValue('Phone');
          const shippingTerms = getHeaderValue('Shipping Terms') || getHeaderValue('ShippingTerms');
          const currency = getHeaderValue('Currency') || 'EUR';
          
          // Parse invoice date
          let invoiceDate = new Date();
          if (invoiceDateStr) {
            const parsed = new Date(invoiceDateStr);
            if (!isNaN(parsed.getTime())) {
              invoiceDate = parsed;
            }
          }
          
          // Find line items section
          const lineItemsHeaderIndex = jsonData.findIndex(r => 
            r[0]?.toString().toLowerCase().includes('phone model') ||
            r[0]?.toString().toLowerCase() === 'line items'
          );
          
          // If we found "LINE ITEMS" label, skip to next row for actual headers
          let itemsStartIndex = lineItemsHeaderIndex + 1;
          if (jsonData[lineItemsHeaderIndex]?.[0]?.toString().toLowerCase() === 'line items') {
            itemsStartIndex = lineItemsHeaderIndex + 2;
          }
          
          // Find where totals section starts
          const totalsIndex = jsonData.findIndex((r, idx) => 
            idx > lineItemsHeaderIndex && 
            (r[0]?.toString().toLowerCase() === 'totals' || 
             r[0]?.toString().toLowerCase().includes('sub total'))
          );
          
          const itemsEndIndex = totalsIndex > 0 ? totalsIndex : jsonData.length;
          
          // Parse line items
          const items: ExcelInvoiceData['items'] = [];
          for (let i = itemsStartIndex; i < itemsEndIndex; i++) {
            const row = jsonData[i];
            if (!row || !row[0] || row[0].toString().trim() === '') continue;
            
            const phoneModel = row[0]?.toString() || '';
            const color = row[1]?.toString() || '';
            const qty = parseFloat(row[2]?.toString() || '0') || 0;
            const unitPrice = parseFloat(row[3]?.toString() || '0') || 0;
            const lineTotal = parseFloat(row[4]?.toString() || '0') || (qty * unitPrice);
            
            if (phoneModel && qty > 0) {
              items.push({ phoneModel, color, qty, unitPrice, lineTotal });
            }
          }
          
          // Parse totals
          const getTotal = (label: string): number => {
            const row = jsonData.find(r => 
              r[0]?.toString().toLowerCase().replace(/\s+/g, '') === label.toLowerCase().replace(/\s+/g, '')
            );
            return row ? (parseFloat(row[1]?.toString() || '0') || 0) : 0;
          };
          
          const subTotal = getTotal('Sub Total') || getTotal('SubTotal') || items.reduce((sum, item) => sum + item.lineTotal, 0);
          const shipping = getTotal('Shipping');
          const total = getTotal('Total') || (subTotal + shipping);
          
          // Validate required fields
          if (!invoiceNumber) {
            reject(new Error('Invoice number is required'));
            return;
          }
          
          if (items.length === 0) {
            reject(new Error('At least one line item is required'));
            return;
          }
          
          resolve({
            invoiceNumber,
            invoiceDate,
            customerName,
            billingAddress,
            shippingAddress,
            vatNumber,
            email,
            phone,
            shippingTerms,
            currency,
            items,
            subTotal,
            shipping,
            total,
          });
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(new Error('Failed to parse Excel file. Please ensure it follows the correct format.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsBinaryString(file);
    });
  };

  return {
    generateExcelTemplate,
    parseExcelFile,
  };
}
