-- Add buying_rate column to invoice_items table for tracking purchase costs
ALTER TABLE public.invoice_items 
ADD COLUMN buying_rate numeric NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.invoice_items.buying_rate IS 'The cost price / buying rate for purchase invoice items';