import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import usePageMeta from '../hooks/usePageMeta'

export default function NotFoundPage() {
  usePageMeta('Page not found — SportsHub')
  return (
    <PageContainer className="text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Page not found
      </h1>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Back to Home
      </Link>
    </PageContainer>
  )
}