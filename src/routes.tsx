import * as React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ScrollToTop } from '@/components/ScrollToTop'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LightModeBoundary } from '@/components/LightModeBoundary'

const LoginPage = React.lazy(() => import('@/pages/LoginPage'))
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'))
const SetupWizardPage = React.lazy(() => import('@/pages/setup/SetupWizardPage'))
const EnrollmentPage = React.lazy(() => import('@/pages/EnrollmentPage'))
const BillingPage = React.lazy(() => import('@/pages/BillingPage'))
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage'))
const ContentPage = React.lazy(() => import('@/pages/ContentPage'))
const CommunicationsPage = React.lazy(() => import('@/pages/CommunicationsPage'))
const ThemingPage = React.lazy(() => import('@/pages/ThemingPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="text-muted-foreground">Loading…</div>
    </div>
  )
}

export function AppRoutes() {
  const withProtected = (node: React.ReactNode) => (
    <ProtectedRoute>
      <LightModeBoundary>{node}</LightModeBoundary>
    </ProtectedRoute>
  )

  const withLight = (node: React.ReactNode) => <LightModeBoundary>{node}</LightModeBoundary>

  return (
    <React.Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Routes>
        <Route path="login" element={withLight(<LoginPage />)} />
        <Route index element={withProtected(<DashboardPage />)} />
        <Route path="setup" element={withProtected(<SetupWizardPage />)} />
        <Route path="enrollment" element={withProtected(<EnrollmentPage />)} />
        <Route path="billing" element={withProtected(<BillingPage />)} />
        <Route path="reports" element={withProtected(<ReportsPage />)} />
        <Route path="content" element={withProtected(<ContentPage />)} />
        <Route path="communications" element={withProtected(<CommunicationsPage />)} />
        <Route path="theming" element={withProtected(<ThemingPage />)} />
      </Routes>
    </React.Suspense>
  )
}
