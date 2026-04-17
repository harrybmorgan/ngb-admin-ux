import { CommunicationsOnDemandDashboard } from '@/components/communications/CommunicationsOnDemandDashboard'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'

export default function CommunicationsPage() {
  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CommunicationsOnDemandDashboard />
      </main>
      <AdminFooter />
    </div>
  )
}
