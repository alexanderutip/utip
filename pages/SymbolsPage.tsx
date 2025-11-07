import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuoteDetails } from '../types';
import Spinner from '../components/Spinner';
import { useSubscription } from '../context/SubscriptionContext';

interface SymbolsPageProps {
  navigateTo: (page: 'symbols' | 'settings') => void;
}

const SymbolsPage: React.FC<SymbolsPageProps> = ({ navigateTo }) => {
  const { utipToken, logout, acsToken } = useAuth();
  const { allSymbols, subscribedSymbols, isLoading: isSymbolsLoading, error: symbolsError } = useSubscription();

  const [quotes, setQuotes] = useState<Record<string, QuoteDetails>>({});
  const [filter, setFilter] = useState('');

  // Effect to establish the second WebSocket for real-time quotes
  useEffect(() => {
    if (subscribedSymbols.length === 0) {
      console.log("Quotes WebSocket: No symbols subscribed. Connection not started.");
      setQuotes({}); // Clear quotes if there are no subscriptions
      return;
    }

    console.log(`Quotes WebSocket: Attempting to connect for symbols:`, subscribedSymbols);
    const wsQuotes = new WebSocket('wss://dev-virt-point.utip.work/session');

    wsQuotes.onopen = () => {
      const subscriptionMessage = {
        "requestType": "tickers",
        "symbols": subscribedSymbols
      };
      console.log('Quotes WebSocket: Connection established. Sending subscription message:', subscriptionMessage);
      wsQuotes.send(JSON.stringify(subscriptionMessage));
    };

    wsQuotes.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.msgType === 'quote' && data.quoteDetails) {
          // console.log('Quotes WebSocket: Received quote:', data.quoteDetails); // Can be noisy
          setQuotes(prevQuotes => ({
            ...prevQuotes,
            [data.quoteDetails.symbol]: data.quoteDetails
          }));
        } else {
          // Log other messages that are not quotes
           console.log('Quotes WebSocket: Received non-quote message:', data);
        }
      } catch (e) {
        console.error('Error parsing quote message:', e);
      }
    };

    wsQuotes.onerror = (event) => console.error('Quotes WebSocket error:', event);
    wsQuotes.onclose = (event) => console.log(`Quotes WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);

    // Cleanup function to close the WebSocket connection
    return () => {
      if (wsQuotes.readyState === WebSocket.OPEN || wsQuotes.readyState === WebSocket.CONNECTING) {
          console.log('Quotes WebSocket: Closing connection.');
          wsQuotes.close();
      }
    };
  }, [subscribedSymbols]);
  
  const subscribedSymbolDetails = useMemo(() => {
    const subscribedSet = new Set(subscribedSymbols);
    return allSymbols.filter(s => subscribedSet.has(s.Symbol));
  }, [allSymbols, subscribedSymbols]);

  const filteredSymbols = useMemo(() => {
    if (!filter) return subscribedSymbolDetails;
    return subscribedSymbolDetails.filter(symbol =>
      symbol.Symbol.toLowerCase().includes(filter.toLowerCase()) ||
      (symbol.Description && symbol.Description.toLowerCase().includes(filter.toLowerCase()))
    );
  }, [subscribedSymbolDetails, filter]);

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp || isNaN(parseInt(timestamp))) return '-';
    // The timestamp is in seconds, convert to milliseconds for JavaScript Date
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-background-dark text-text dark:text-text-dark">
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Subscribed Symbols</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('settings')}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-gray-200 dark:bg-input-dark text-text dark:text-text-dark hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors"
              >
                Settings
              </button>
              <button
                onClick={logout}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </header>
          
          <div className="mb-4">
              <input
                  type="text"
                  placeholder="Filter subscribed symbols..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full max-w-sm bg-input dark:bg-input-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 placeholder-text-medium dark:placeholder-text-medium-dark focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
              />
          </div>

          {isSymbolsLoading && subscribedSymbols.length === 0 && (
            <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
          )}

          {symbolsError && (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-md text-center mb-4">
              <p>{symbolsError}</p>
            </div>
          )}

          {!isSymbolsLoading && filteredSymbols.length === 0 && (
            <div className="text-center py-10 bg-card dark:bg-card-dark rounded-xl">
                <p className="text-text-medium dark:text-text-medium-dark">
                    {subscribedSymbols.length > 0 ? "No symbols match your filter." : "You have no subscribed symbols."}
                </p>
                <button onClick={() => navigateTo('settings')} className="mt-4 text-primary dark:text-primary-dark font-semibold">
                    Go to Settings to subscribe
                </button>
            </div>
          )}

          {filteredSymbols.length > 0 && (
            <div className="overflow-x-auto bg-card dark:bg-card-dark rounded-xl shadow-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-medium dark:text-text-medium-dark uppercase tracking-wider">Symbol</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-medium dark:text-text-medium-dark uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-medium dark:text-text-medium-dark uppercase tracking-wider">Bid</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-medium dark:text-text-medium-dark uppercase tracking-wider">Ask</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-medium dark:text-text-medium-dark uppercase tracking-wider">Last Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSymbols.map((symbol) => {
                    const quote = quotes[symbol.Symbol];
                    return (
                    <tr key={symbol.Symbol} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{symbol.Symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-medium dark:text-text-medium-dark">{symbol.Description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{quote ? quote.bid : <span className="text-gray-500">-</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{quote ? quote.ask : <span className="text-gray-500">-</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-medium dark:text-text-medium-dark">{quote ? formatTimestamp(quote.date) : <span className="text-gray-500">-</span>}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <footer className="bg-card dark:bg-card-dark text-xs text-text-medium dark:text-text-medium-dark p-3 text-center break-all shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto">
          <p className="mb-1">
            <strong>ACS Token:</strong> {acsToken ? `${acsToken.substring(0, 30)}...` : 'N/A'}
          </p>
          {utipToken && (
            <p>
                <strong>UTIP Token:</strong> {`${utipToken.substring(0, 30)}...`}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default SymbolsPage;