import * as React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ScrollToTop } from '@/components/ScrollToTop'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LightModeBoundary } from '@/components/LightModeBoundary'

const LoginPage = React.lazy(() => import('@/pages/LoginPage'))
const MemberHandoffPage = React.lazy(() => import('@/pages/MemberHandoffPage'))
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'))
const SetupWizardPage = React.lazy(() => import('@/pages/setup/SetupWizardPage'))
const EnrollmentPage = React.lazy(() => import('@/pages/EnrollmentPage'))
const BillingPage = React.lazy(() => import('@/pages/BillingPage'))
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage'))
const ReportDetailPage = React.lazy(() => import('@/pages/ReportDetailPage'))
const ReportCustomizePage = React.lazy(() => import('@/pages/ReportCustomizePage'))
const ContentPage = React.lazy(() => import('@/pages/ContentPage'))
const CommunicationsPage = React.lazy(() => import('@/pages/CommunicationsPage'))
const AddCommunicationUserIdsPage = React.lazy(() => import('@/pages/AddCommunicationUserIdsPage'))
const ThemingPage = React.lazy(() => import('@/pages/ThemingPage'))
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'))
const TicketsPage = React.lazy(() => import('@/pages/TicketsPage'))

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
        <Route path="member-handoff" element={withLight(<MemberHandoffPage />)} />
        <Route index element={withProtected(<DashboardPage />)} />
        <Route path="setup" element={withProtected(<SetupWizardPage />)} />
        <Route path="enrollment" element={withProtected(<EnrollmentPage />)} />
        <Route path="billing" element={withProtected(<BillingPage />)} />
        <Route path="reports/:reportId/customize" element={withProtected(<ReportCustomizePage />)} />
        <Route path="reports/:reportId" element={withProtected(<ReportDetailPage />)} />
        <Route path="reports" element={withProtected(<ReportsPage />)} />
        <Route path="content" element={withProtected(<ContentPage />)} />
        <Route path="communications/new" element={withProtected(<AddCommunicationUserIdsPage />)} />
        <Route path="communications" element={withProtected(<CommunicationsPage />)} />
        <Route path="theming" element={withProtected(<ThemingPage />)} />
        <Route path="settings" element={withProtected(<SettingsPage />)} />
        <Route path="tickets" element={withProtected(<TicketsPage />)} />
      </Routes>
    </React.Suspense>
  )
}
