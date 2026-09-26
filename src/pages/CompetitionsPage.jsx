import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'

export default function CompetitionsPage() {
  return (
    <PageContainer title="Competitions" description="Browse and manage the competitions running in SportsHub.">
      <EmptyState
        title="No competitions yet"
        description="Create your first competition to get started."
        action={
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Create Competition
          </button>
        }
      />
    </PageContainer>
  )
}