import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import Spinner from '../components/Spinner';

interface SettingsPageProps {
  navigateTo: (page: 'symbols' | 'settings') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ navigateTo }) => {
  const { theme, toggleTheme } = useTheme();
  const { allSymbols, toggleSubscription, isSubscribed, isLoading, error } = useSubscription();

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <button
            onClick={() => navigateTo('symbols')}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary dark:bg-primary-dark hover:bg-primary-hover dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-dark focus:ring-offset-background dark:focus:ring-offset-background-dark transition-colors"
          >
            &larr; Back to Symbols
          </button>
        </header>

        {/* Theme Settings */}
        <div className="bg-card dark:bg-card-dark rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <span className="text-text-medium dark:text-text-medium-dark">
              Theme
            </span>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-input dark:bg-input-dark"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>

        {/* Symbol Subscriptions */}
        <div className="bg-card dark:bg-card-dark rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Symbol Subscriptions</h2>
          {isLoading && <Spinner />}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {allSymbols.map(symbol => (
                <div key={symbol.Symbol} className="flex items-center justify-between p-3 bg-background dark:bg-background-dark rounded-lg">
                  <div>
                    <p className="font-medium">{symbol.Symbol}</p>
                    <p className="text-sm text-text-medium dark:text-text-medium-dark">{symbol.Description}</p>
                  </div>
                  <button
                    onClick={() => toggleSubscription(symbol.Symbol)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      isSubscribed(symbol.Symbol)
                        ? 'bg-green-500 text-white'
                        : 'bg-input dark:bg-input-dark text-text dark:text-text-dark'
                    }`}
                  >
                    {isSubscribed(symbol.Symbol) ? 'Subscribed' : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;