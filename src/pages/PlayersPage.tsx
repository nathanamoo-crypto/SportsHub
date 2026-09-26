import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'

export default function PlayersPage() {
  return (
    <PageContainer title="Players" description="Manage the players registered with each team.">
      <EmptyState
        title="No players yet"
        description="Players will appear here once you have added them to a team."
      />
    </PageContainer>
  )
}