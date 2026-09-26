import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import PageContainer from '../../components/PageContainer'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { fetchOrgCompetitions } from '../../services/competitions'
import type { Competition } from '../../types/domain'

const statCardClass = 'rounded-2xl border border-slate-200 bg-white p-6'

export default function OrganizerDashboardPage() {
  const { user, profile, loading } = useAuth()
  const [competitions, setCompetitions] = useState<Competition[] | null>(null)
  const [fetchError, setFetchError] = useState('')

  const load = useCallback(() => {
    if (!user) return
    fetchOrgCompetitions(user.id).then(({ data, error }) => {
      if (error) {
        setFetchError(error.message)
        return
      }
      setCompetitions((data ?? []) as unknown as Competition[])
    })
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <LoadingSpinner label="Loading your organizer dashboard..." />
  }

  const fullName = profile?.full_name || user?.email?.split('@')[0] || ''
  const firstName = fullName.split(' ')[0] || 'there'
  const total = competitions?.length ?? 0
  const drafts = competitions?.filter((c) => c.status === 'draft').length ?? 0
  const published = competitions?.filter((c) => c.status === 'published').length ?? 0

  const stats = [
    { label: 'Total competitions', value: total },
    { label: 'Draft competitions', value: drafts },
    { label: 'Published competitions', value: published },
  ]

  const createCta = (
    <Link
      to="/organizer/competitions/new"
      className="inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
    >
      Create competition
    </Link>
  )

  return (
    <PageContainer
      title={`Welcome, ${firstName}`}
      description="Manage your competitions from here."
    >
      {fetchError ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </p>
      ) : null}

      {competitions === null ? (
        <LoadingSpinner label="Loading competitions..." />
      ) : total === 0 ? (
        <EmptyState
          title="No competitions yet"
          description="Create your first competition to start organizing."
          action={createCta}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className={statCardClass}>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {competitions?.length ? (
        <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/organizer/competitions"
              className="font-medium text-brand-700 hover:underline"
            >
              Manage competitions
            </Link>
            <Link to="/organizer/teams" className="font-medium text-brand-700 hover:underline">
              Manage teams
            </Link>
          </div>
          {createCta}
        </div>
      ) : null}
    </PageContainer>
  )
}