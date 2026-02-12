import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Stock from "./pages/Stock";
import Invoices from "./pages/Invoices";
import PurchaseBills from "./pages/PurchaseBills";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Sellers from "./pages/Sellers";
import Settings from "./pages/Settings";
import CurrencyConverter from "./pages/CurrencyConverter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Determine basename based on deployment environment
// GitHub Pages uses /NFB-Trading/, local dev uses /
const basename = import.meta.env.MODE === 'production' ? '/NFB-Trading' : '/';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/purchase-bills" element={<PurchaseBills />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/currency" element={<CurrencyConverter />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
