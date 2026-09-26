import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'

export default function TeamsPage() {
  return (
    <PageContainer title="Teams" description="Manage the teams taking part in your competitions.">
      <EmptyState
        title="No teams registered"
        description="Teams will appear here once you have created a competition and registered participants."
      />
    </PageContainer>
  )
}