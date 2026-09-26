import { useAuth } from '../hooks/useAuth'
import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner label="Loading your dashboard..." />
  }

  const fullName = profile?.full_name || user?.email?.split('@')[0] || ''
  const firstName = fullName.split(' ')[0] || 'there'

  return (
    <PageContainer
      title={`Welcome, ${firstName}`}
      description="Here is what is happening across your SportsHub account."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EmptyState
          title="No competitions yet"
          description="Competitions you create or join will appear here."
        />
        <EmptyState
          title="No teams yet"
          description="Teams you are a part of will appear here."
        />
        <EmptyState
          title="No player profile activity yet"
          description="Your match activity and statistics will appear here once matches are recorded."
        />
      </div>
    </PageContainer>
  )
}