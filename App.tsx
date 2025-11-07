import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Spinner from './components/Spinner';

// Ленивая загрузка компонентов страниц. Они будут загружены только при первом рендеринге.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SymbolsPage = lazy(() => import('./pages/SymbolsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

type Page = 'symbols' | 'settings';

const AppContent: React.FC = () => {
  const { acsToken } = useAuth();
  const [page, setPage] = useState<Page>('symbols');

  if (!acsToken) {
    return <LoginPage />;
  }

  return (
    <SubscriptionProvider>
      {page === 'symbols' && <SymbolsPage navigateTo={setPage} />}
      {page === 'settings' && <SettingsPage navigateTo={setPage} />}
    </SubscriptionProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
              <Spinner size="lg" />
            </div>
          }
        >
          <AppContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
