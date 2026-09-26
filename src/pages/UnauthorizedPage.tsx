import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import usePageMeta from '../hooks/usePageMeta'

export default function UnauthorizedPage() {
  usePageMeta('Access denied — SportsHub')
  return (
    <PageContainer className="text-center">
      <p className="text-6xl font-extrabold text-brand-600">403</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Access denied</h1>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        You need an organizer account to view this area of SportsHub.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:w-auto"
        >
          Back to Home
        </Link>
        <Link
          to="/competitions"
          className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:w-auto"
        >
          Browse competitions
        </Link>
      </div>
    </PageContainer>
  )
}