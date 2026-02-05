-- Create sellers table
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company_name TEXT,
  vat_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  company_name TEXT,
  vat_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table with specs instead of model
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specs TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL DEFAULT 'nfb-trading',
  seller_id UUID REFERENCES public.sellers(id),
  customer_id UUID REFERENCES public.customers(id),
  billing_address TEXT,
  shipping_address TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  specs TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public access for now since no auth yet)
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create public access policies (can be restricted later with auth)
CREATE POLICY "Allow public read sellers" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Allow public insert sellers" ON public.sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sellers" ON public.sellers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sellers" ON public.sellers FOR DELETE USING (true);

CREATE POLICY "Allow public read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete customers" ON public.customers FOR DELETE USING (true);

CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete invoices" ON public.invoices FOR DELETE USING (true);

CREATE POLICY "Allow public read invoice_items" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert invoice_items" ON public.invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update invoice_items" ON public.invoice_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete invoice_items" ON public.invoice_items FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample sellers
INSERT INTO public.sellers (name, company_name, email, phone, address) VALUES
  ('NFB Trading LTD', 'NFB Trading LTD', 'sales@nfbtrading.com', '+44 20 7123 4567', '123 Business Street, London, UK'),
  ('TELETEK TECHNAHH BV', 'TELETEK TECHNAHH BV', 'info@teletek.nl', '+31 20 123 4567', '456 Tech Avenue, Amsterdam, NL');

-- Insert sample customers
INSERT INTO public.customers (name, email, phone, billing_address) VALUES
  ('Mark Johnson', 'mark@company.com', '+44 20 7123 4567', '123 Business Street, London, UK'),
  ('Sarah Williams', 'sarah@techcorp.com', NULL, '456 Tech Avenue, Amsterdam, NL'),
  ('David Chen', 'david@electronics.com', NULL, '789 Commerce Road, Berlin, DE');

-- Insert sample products
INSERT INTO public.products (name, specs, color, quantity, unit_price, min_stock, category) VALUES
  ('iPhone 15 Pro Max', '256GB, A17 Pro chip', 'Natural Titanium', 45, 1199, 10, 'Smartphones'),
  ('iPhone 15 Pro', '128GB, A17 Pro chip', 'Blue Titanium', 32, 999, 10, 'Smartphones'),
  ('iPhone 15', '128GB, A16 chip', 'Pink', 8, 799, 15, 'Smartphones'),
  ('iPhone 14', '128GB, A15 chip', 'Midnight', 5, 699, 10, 'Smartphones'),
  ('Samsung Galaxy S24 Ultra', '256GB, Snapdragon 8 Gen 3', 'Titanium Black', 28, 1299, 8, 'Smartphones'),
  ('Google Pixel 8 Pro', '128GB, Tensor G3', 'Obsidian', 15, 999, 5, 'Smartphones'),
  ('MacBook Pro 16"', 'M3 Max, 36GB RAM, 1TB SSD', 'Space Black', 12, 2499, 5, 'Laptops'),
  ('iPad Pro 12.9"', 'M2 chip, 256GB, WiFi', 'Silver', 3, 1099, 8, 'Tablets');