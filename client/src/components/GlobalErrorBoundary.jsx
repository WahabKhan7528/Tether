import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-md w-full bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-[#333]">
        <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We encountered an unexpected error while loading this page.
          </p>
          
          {error?.message && (
            <div className="w-full bg-gray-50 dark:bg-[#252525] rounded-xl p-4 mt-4 text-left border border-gray-200 dark:border-[#333] overflow-x-auto">
              <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
                {error.message}
              </p>
            </div>
          )}

          <button
            onClick={resetErrorBoundary}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
