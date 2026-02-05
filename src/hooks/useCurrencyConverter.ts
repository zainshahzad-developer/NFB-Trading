import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
];

// Fallback static exchange rates (base: EUR)
const FALLBACK_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.86,
  CNY: 7.85,
  JPY: 163.50,
  AED: 3.97,
  HKD: 8.45,
};

export function useCurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState<string>('EUR');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<number>(1);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);

  // Fetch live rates from edge function
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-exchange-rates');
      
      if (error) {
        console.error('Error fetching rates:', error);
        setIsLive(false);
        return;
      }

      if (data?.rates) {
        setRates(data.rates);
        setLastUpdated(new Date(data.lastUpdated));
        setIsLive(!data.fallback);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch rates on mount
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const convert = useCallback((value: number, from: string, to: string): number => {
    if (from === to) return value;
    
    // Convert to EUR first (base currency), then to target
    const valueInEUR = value / (rates[from] || 1);
    const result = valueInEUR * (rates[to] || 1);
    
    return Math.round(result * 100) / 100;
  }, [rates]);

  const formatCurrency = useCallback((value: number, currencyCode: string): string => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    const symbol = currency?.symbol || currencyCode;
    
    return `${symbol} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }, []);

  const getRate = useCallback((from: string, to: string): number => {
    if (from === to) return 1;
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    return toRate / fromRate;
  }, [rates]);

  useEffect(() => {
    const result = convert(amount, fromCurrency, toCurrency);
    setConvertedAmount(result);
  }, [amount, fromCurrency, toCurrency, convert]);

  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  return {
    fromCurrency,
    setFromCurrency,
    toCurrency,
    setToCurrency,
    amount,
    setAmount,
    convertedAmount,
    convert,
    formatCurrency,
    getCurrencySymbol,
    getRate,
    swapCurrencies,
    currencies: CURRENCIES,
    rates,
    lastUpdated,
    isLoading,
    isLive,
    refreshRates: fetchRates,
  };
}
