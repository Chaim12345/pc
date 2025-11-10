import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from './routes'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { PageProvider } from './contexts/PageContext'
import ErrorBoundary from './components/ErrorBoundary'
import SkipLinks from './components/SkipLinks'
import { errorReportingService } from './utils/errorReporting'

// Initialize error reporting
errorReportingService.init()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <SkipLinks />
            <AuthProvider>
              <SocketProvider>
                <ToastProvider>
                  <PageProvider>
                    <AppRoutes />
                  </PageProvider>
                </ToastProvider>
              </SocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App

