-- Add invoice_type column to invoices table
ALTER TABLE public.invoices
ADD COLUMN invoice_type text NOT NULL DEFAULT 'sales';

-- Add a check constraint to ensure valid values
ALTER TABLE public.invoices
ADD CONSTRAINT invoices_invoice_type_check CHECK (invoice_type IN ('sales', 'purchase'));