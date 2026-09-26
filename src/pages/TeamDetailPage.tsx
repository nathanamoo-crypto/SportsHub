import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { fetchTeamCompetitions, fetchTeamBySlug } from '../services/teams'
import { fetchSquad } from '../services/squads'
import { positionLabel } from '../utils/positions'
import type { Team, SquadMember, TeamCompetitionEntry } from '../types/domain'

interface TeamDetailResult {
  slug: string
  phase: 'loading' | 'ready'
  team: Team | null
  squad: SquadMember[] | null
  competitions: TeamCompetitionEntry[] | null
  notFound: boolean
}

const initialResult: TeamDetailResult = {
  slug: '',
  phase: 'loading',
  team: null,
  squad: null,
  competitions: null,
  notFound: false,
}

export default function TeamDetailPage() {
  const { slug: slugParam } = useParams()
  const slug = slugParam ?? ''
  const [result, setResult] = useState<TeamDetailResult>({ ...initialResult, slug })

  useEffect(() => {
    let active = true
    fetchTeamBySlug(slug).then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setResult({
          slug,
          phase: 'loading',
          team: null,
          squad: null,
          competitions: null,
          notFound: true,
        })
        return
      }
      const team = data as unknown as Team
      Promise.all([fetchSquad(team.id), fetchTeamCompetitions(team.id)]).then(
        ([squadResult, competitionsResult]) => {
          if (!active) return
          setResult({
            slug,
            phase: 'ready',
            team,
            squad: (squadResult.data ?? []) as unknown as SquadMember[],
            competitions: (competitionsResult.data ?? []) as unknown as TeamCompetitionEntry[],
            notFound: false,
          })
        },
      )
    })
    return () => {
      active = false
    }
  }, [slug])

  if (result.slug !== slug) {
    return <LoadingSpinner label="Loading team..." />
  }

  if (result.notFound) {
    return (
      <PageContainer className="text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Team not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          This team does not exist, is not part of a published competition, or has not been made
          public yet.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to Home
        </Link>
      </PageContainer>
    )
  }

  if (result.phase !== 'ready' || !result.team) {
    return <LoadingSpinner label="Loading team..." />
  }

  const { team, squad, competitions } = result
  const enteredCompetitions = (competitions ?? []).filter(
    (entry) => entry.status === 'active' && entry.competitions?.status === 'published',
  )

  return (
    <PageContainer title={team.name} description={`The ${team.name} squad and competitions.`}>
      <div className="max-w-3xl space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4">
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={`${team.name} logo`}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-2xl font-bold text-brand-700">
                {team.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{team.name}</h2>
              <p className="text-sm text-slate-600">
                Manager: {team.manager?.full_name ?? 'Not assigned'}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Squad</h2>
          {squad?.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
              No players published yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Full name</th>
                    <th className="px-4 py-3 font-semibold">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(squad ?? []).map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3 font-semibold text-brand-700">
                        {member.shirt_number}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {member.players.first_name} {member.players.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{positionLabel(member.position)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Competitions entered</h2>
          {enteredCompetitions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
              Not entered in any published competition yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {enteredCompetitions.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/competitions/${entry.competitions.slug}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-brand-700 hover:bg-slate-50"
                  >
                    {entry.competitions.name}
                    <StatusBadge status={entry.competitions.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  )
}