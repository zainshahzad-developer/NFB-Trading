import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, TrendingUp, RefreshCw, Globe } from 'lucide-react';
import { useCurrencyConverter, CURRENCIES } from '@/hooks/useCurrencyConverter';
import { format } from 'date-fns';

export default function CurrencyConverter() {
  const {
    fromCurrency,
    setFromCurrency,
    toCurrency,
    setToCurrency,
    amount,
    setAmount,
    convertedAmount,
    swapCurrencies,
    formatCurrency,
    getRate,
    rates,
    lastUpdated,
    isLoading,
    isLive,
    refreshRates,
  } = useCurrencyConverter();

  const currentRate = getRate(fromCurrency, toCurrency);

  return (
    <MainLayout 
      title="Currency Converter" 
      subtitle="Convert between currencies with real-time exchange rates"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Converter Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Currency Converter
            </CardTitle>
            <CardDescription>
              Enter an amount and select currencies to convert
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* From Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">From</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                    className="text-2xl h-14 font-semibold"
                  />
                </div>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-[180px] h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{currency.symbol}</span>
                          <span>{currency.code}</span>
                          <span className="text-muted-foreground text-xs">- {currency.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-12 w-12 border-2"
                onClick={swapCurrencies}
              >
                <ArrowLeftRight className="h-5 w-5" />
              </Button>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">To</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="text-2xl h-14 font-bold flex items-center px-3 bg-muted rounded-md border">
                    {formatCurrency(convertedAmount, toCurrency)}
                  </div>
                </div>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-[180px] h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{currency.symbol}</span>
                          <span>{currency.code}</span>
                          <span className="text-muted-foreground text-xs">- {currency.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Exchange Rate</span>
                {isLive && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Live
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {format(lastUpdated, 'MMM d, yyyy HH:mm')}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={refreshRates}
                    disabled={isLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exchange Rates</CardTitle>
            <CardDescription>Base: EUR (€)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CURRENCIES.filter(c => c.code !== 'EUR').map((currency) => (
                <div 
                  key={currency.code}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg w-8">{currency.symbol}</span>
                    <div>
                      <p className="font-medium">{currency.code}</p>
                      <p className="text-xs text-muted-foreground">{currency.name}</p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {rates[currency.code]?.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Conversion Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { from: 'EUR', to: 'USD', amount: 100 },
          { from: 'EUR', to: 'GBP', amount: 100 },
          { from: 'USD', to: 'CNY', amount: 100 },
          { from: 'EUR', to: 'AED', amount: 100 },
        ].map((item, index) => {
          const converted = (item.amount / (rates[item.from] || 1)) * (rates[item.to] || 1);
          const fromCurr = CURRENCIES.find(c => c.code === item.from);
          const toCurr = CURRENCIES.find(c => c.code === item.to);
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {fromCurr?.symbol}{item.amount} {item.from}
                    </p>
                    <p className="text-xl font-bold">
                      {toCurr?.symbol}{converted.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.to}</p>
                  </div>
                  <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
}
