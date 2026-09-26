import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import PageContainer from '../../components/PageContainer'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { fetchOwnedTeams } from '../../services/teams'
import type { Team } from '../../types/domain'

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      Inactive
    </span>
  )
}

export default function OrganizerTeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [fetchError, setFetchError] = useState('')

  const load = useCallback(() => {
    if (!user) return
    fetchOwnedTeams(user.id).then(({ data, error }) => {
      if (error) {
        setFetchError(error.message)
        return
      }
      setTeams((data ?? []) as unknown as Team[])
    })
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const headerAction = (
    <Link
      to="/organizer/teams/new"
      className="inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
    >
      Create team
    </Link>
  )

  return (
    <PageContainer
      title="Your teams"
      description="Teams you own. Build squads and enter competitions from here."
    >
      {fetchError ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </p>
      ) : null}

      {teams === null ? (
        <LoadingSpinner label="Loading teams..." />
      ) : teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Create a team to start building a squad."
          action={headerAction}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </p>
            {headerAction}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Team</th>
                  <th className="px-4 py-3 font-semibold">Manager</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {team.logo_url ? (
                          <img
                            src={team.logo_url}
                            alt={`${team.name} logo`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                            {team.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <Link
                          to={`/teams/${team.slug}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {team.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{team.manager?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <ActiveBadge active={team.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/organizer/teams/${team.id}/squad`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Squad
                        </Link>
                        <Link
                          to={`/organizer/teams/${team.id}/edit`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageContainer>
  )
}