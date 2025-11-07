import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const LoginPage: React.FC = () => {
  const [email] = useState('test@test.ru');
  const [password] = useState('123456Aa');
  const { login, isLoading, error: authError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError('An unexpected error occurred during login.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-card dark:bg-card-dark rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text dark:text-text-dark">Welcome Back</h1>
          <p className="text-text-medium dark:text-text-medium-dark">Sign in to view symbols</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-medium dark:text-text-medium-dark">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="mt-1 block w-full bg-input dark:bg-input-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-3 px-4 text-text dark:text-text-dark placeholder-text-medium dark:placeholder-text-medium-dark focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
            />
          </div>

          <div>
            <label htmlFor="password"className="block text-sm font-medium text-text-medium dark:text-text-medium-dark">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              readOnly
              className="mt-1 block w-full bg-input dark:bg-input-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-3 px-4 text-text dark:text-text-dark placeholder-text-medium dark:placeholder-text-medium-dark focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
            />
          </div>

          { (authError || localError) && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
              <p>Login Failed: {authError || localError}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary dark:bg-primary-dark hover:bg-primary-hover dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-hover dark:focus:ring-primary-hover-dark focus:ring-offset-background dark:focus:ring-offset-background-dark disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? <Spinner size="sm" /> : 'Log In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;