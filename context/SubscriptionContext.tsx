import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { SymbolData } from '../types';
import { useAuth } from './AuthContext';

const MOCK_SYMBOLS: SymbolData[] = [
  { Symbol: 'EURUSD', Group: 'Forex', Description: 'Euro vs US Dollar', SwapShort: -0.8, SwapLong: -0.7, ContractSize: 100000, Currency: 'USD' },
  { Symbol: 'USDJPY', Group: 'Forex', Description: 'US Dollar vs Japanese Yen', SwapShort: -0.4, SwapLong: -0.3, ContractSize: 100000, Currency: 'JPY' },
  { Symbol: 'GBPUSD', Group: 'Forex', Description: 'British Pound vs US Dollar', SwapShort: -0.6, SwapLong: -0.5, ContractSize: 100000, Currency: 'USD' },
  { Symbol: 'BTCUSD', Group: 'Crypto', Description: 'Bitcoin vs US Dollar', SwapShort: -25.0, SwapLong: -22.5, ContractSize: 1, Currency: 'USD' },
  { Symbol: 'ETHUSD', Group: 'Crypto', Description: 'Ethereum vs US Dollar', SwapShort: -1.5, SwapLong: -1.2, ContractSize: 1, Currency: 'USD' },
];

interface SubscriptionContextType {
  allSymbols: SymbolData[];
  subscribedSymbols: string[];
  toggleSubscription: (symbolName: string) => void;
  isSubscribed: (symbolName: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { utipToken, acsToken } = useAuth();
  const [allSymbols, setAllSymbols] = useState<SymbolData[]>([]);
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial state from localStorage
  useEffect(() => {
    try {
        const cachedSymbols = localStorage.getItem('symbols-list');
        if (cachedSymbols) {
            setAllSymbols(JSON.parse(cachedSymbols));
            setIsLoading(false); // Immediately set loading to false if we have cached data
        }
        const cachedSubscriptions = localStorage.getItem('subscribed-symbols');
        if (cachedSubscriptions) {
            setSubscribedSymbols(JSON.parse(cachedSubscriptions));
        }
    } catch (e) {
        console.error("Failed to load from localStorage", e);
    }
  }, []);

  // Fetch all symbols from WebSocket
  useEffect(() => {
    const token = utipToken || acsToken; // Use utipToken first, fallback to acsToken
    if (!token) {
      if(allSymbols.length === 0) {
        console.warn("No token available for symbols WebSocket, loading mock symbols.");
        setAllSymbols(MOCK_SYMBOLS);
        // Set default subscriptions from mock data if none exist
        const cachedSubscriptions = localStorage.getItem('subscribed-symbols');
         if (!cachedSubscriptions) {
            const defaultSubscriptions = MOCK_SYMBOLS.slice(0, 5).map(s => s.Symbol);
            setSubscribedSymbols(defaultSubscriptions);
            localStorage.setItem('subscribed-symbols', JSON.stringify(defaultSubscriptions));
        }
      }
      setIsLoading(false);
      return;
    }

    const ws = new WebSocket(`wss://dev-virt-point.utip.work/session/${token}?fragment=1`);
    let messageReceived = false;

    ws.onopen = () => {
      ws.send(JSON.stringify({ "commandCode": "2088", "notSendQuotes": "1" }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.msgType === 'symbols' && Array.isArray(data.symbolsArray)) {
          messageReceived = true;
          const symbolList: SymbolData[] = data.symbolsArray.map((s: any) => ({
            Symbol: s.symbolName,
            Description: s.Description || `${s.symbolName} description`,
            // Add other fields from s if necessary
            Group: s.Group || 'N/A',
            SwapShort: s.SwapShort || 0,
            SwapLong: s.SwapLong || 0,
            ContractSize: s.ContractSize || 0,
            Currency: s.Currency || 'N/A',
          }));
          setAllSymbols(symbolList);
          localStorage.setItem('symbols-list', JSON.stringify(symbolList));
          setError(null);
          setIsLoading(false); // Set loading to false as soon as data is processed

          // If there are no existing subscriptions, subscribe to the first 5 symbols by default.
          const cachedSubscriptions = localStorage.getItem('subscribed-symbols');
          if (!cachedSubscriptions && symbolList.length > 0) {
            console.log("Setting default subscriptions...");
            const defaultSubscriptions = symbolList.slice(0, 5).map(s => s.Symbol);
            setSubscribedSymbols(defaultSubscriptions);
            localStorage.setItem('subscribed-symbols', JSON.stringify(defaultSubscriptions));
          }
        }
      } catch (e) {
        console.error('Error processing symbols message:', e);
        setError('Failed to parse symbol data.');
        setIsLoading(false); // Also stop loading on error
      }
    };
    
    ws.onerror = () => {
      setError("Symbol connection error.");
    };

    ws.onclose = () => {
      if (!messageReceived && allSymbols.length === 0) {
        setError("Could not fetch symbols. Using mock data.");
        setAllSymbols(MOCK_SYMBOLS);
        localStorage.setItem('symbols-list', JSON.stringify(MOCK_SYMBOLS));
         // Set default subscriptions from mock data if none exist
        const cachedSubscriptions = localStorage.getItem('subscribed-symbols');
         if (!cachedSubscriptions) {
            const defaultSubscriptions = MOCK_SYMBOLS.slice(0, 5).map(s => s.Symbol);
            setSubscribedSymbols(defaultSubscriptions);
            localStorage.setItem('subscribed-symbols', JSON.stringify(defaultSubscriptions));
        }
      }
      setIsLoading(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [utipToken, acsToken]);

  const toggleSubscription = useCallback((symbolName: string) => {
    setSubscribedSymbols(prev => {
      const newSubscriptions = prev.includes(symbolName)
        ? prev.filter(s => s !== symbolName)
        : [...prev, symbolName];
      localStorage.setItem('subscribed-symbols', JSON.stringify(newSubscriptions));
      return newSubscriptions;
    });
  }, []);

  const isSubscribed = useCallback((symbolName: string) => {
    return subscribedSymbols.includes(symbolName);
  }, [subscribedSymbols]);

  return (
    <SubscriptionContext.Provider value={{ allSymbols, subscribedSymbols, toggleSubscription, isSubscribed, isLoading, error }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};