-- Create bank_accounts table for storing multiple bank accounts per seller
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  account_title TEXT NOT NULL,
  iban TEXT,
  swift TEXT,
  bank_name TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read bank_accounts" 
ON public.bank_accounts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert bank_accounts" 
ON public.bank_accounts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update bank_accounts" 
ON public.bank_accounts 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete bank_accounts" 
ON public.bank_accounts 
FOR DELETE 
USING (true);

-- Add bank_account_id to invoices table
ALTER TABLE public.invoices 
ADD COLUMN bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();