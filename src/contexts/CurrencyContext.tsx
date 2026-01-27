'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CurrencyCode, DEFAULT_CURRENCY, formatCurrency as formatCurrencyUtil, getCurrencySymbol as getCurrencySymbolUtil, formatCurrencyValue as formatCurrencyValueUtil } from '@/lib/currency';
import { updateCurrency as updateCurrencyAction } from '@/app/actions/settings';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => Promise<{ success: boolean; error?: string }>;
  formatCurrency: (amount: number | string) => string;
  formatCurrencyValue: (amount: number | string) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  initialCurrency?: CurrencyCode;
}

export function CurrencyProvider({ children, initialCurrency = DEFAULT_CURRENCY }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);

  const setCurrency = useCallback(async (newCurrency: CurrencyCode) => {
    const result = await updateCurrencyAction(newCurrency);
    if (result.success) {
      setCurrencyState(newCurrency);
    }
    return result;
  }, []);

  const formatCurrency = useCallback((amount: number | string) => {
    return formatCurrencyUtil(amount, currency);
  }, [currency]);

  const formatCurrencyValue = useCallback((amount: number | string) => {
    return formatCurrencyValueUtil(amount, currency);
  }, [currency]);

  const symbol = getCurrencySymbolUtil(currency);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, formatCurrencyValue, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
