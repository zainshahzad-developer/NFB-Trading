import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache rates for 1 hour to avoid excessive API calls
let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (cachedRates && (now - cachedRates.timestamp) < CACHE_DURATION) {
      console.log('Returning cached rates');
      return new Response(
        JSON.stringify({ 
          rates: cachedRates.rates, 
          lastUpdated: new Date(cachedRates.timestamp).toISOString(),
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch fresh rates from Frankfurter API (uses European Central Bank rates)
    // Base currency is EUR
    const currencies = 'USD,GBP,CNY,JPY,AED,HKD';
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=EUR&to=${currencies}`
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Add EUR as base (1.0)
    const rates: Record<string, number> = {
      EUR: 1.0,
      ...data.rates
    };

    // Cache the rates
    cachedRates = { rates, timestamp: now };

    console.log('Fetched fresh rates:', rates);

    return new Response(
      JSON.stringify({ 
        rates, 
        lastUpdated: new Date(now).toISOString(),
        cached: false,
        date: data.date
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback static rates if API fails
    const fallbackRates = {
      EUR: 1.0,
      USD: 1.08,
      GBP: 0.86,
      CNY: 7.85,
      JPY: 163.50,
      AED: 3.97,
      HKD: 8.45,
    };

    return new Response(
      JSON.stringify({ 
        rates: fallbackRates, 
        lastUpdated: new Date().toISOString(),
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
