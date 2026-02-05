
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS buying_currency text,
ADD COLUMN IF NOT EXISTS exchange_rate numeric,
ADD COLUMN IF NOT EXISTS buying_price_original numeric;
