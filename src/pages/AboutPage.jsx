import PageContainer from '../components/PageContainer'

export default function AboutPage() {
  return (
    <PageContainer title="About" description="Learn more about SportsHub and what it is built to do.">
      <p className="max-w-2xl text-slate-700">
        SportsHub is a platform for managing sports competitions, teams, and
        players. It is designed to make it easy to run a league from start to
        finish: create a competition, register the Teams, generate fixtures,
        and record results as matches are played. More information will be
        added here as the project evolves.
      </p>
    </PageContainer>
  )
}