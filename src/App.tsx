import * as React from 'react'
import { TooltipProvider } from '@wexinc-healthbenefits/ben-ui-kit'
import { AppRoutes } from '@/routes'
import { AuthProvider } from '@/context/AuthContext'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <h1 className="mb-4 text-2xl font-bold">Application Error</h1>
          <pre className="overflow-auto rounded bg-red-50 p-4 dark:bg-red-900/20">
            {this.state.error?.toString()}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
