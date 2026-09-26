import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

const features = [
  {
    title: 'Competition Management',
    description:
      'Create and manage competitions with the structure your league needs.',
  },
  {
    title: 'Teams & Squads',
    description:
      'Register teams, build squads, and keep every player organised.',
  },
  {
    title: 'Fixtures & Results',
    description:
      'Generate fixtures and record results as the competition unfolds.',
  },
  {
    title: 'Automatic Standings',
    description:
      'Standings update themselves based on the results you record.',
  },
]

const gettingStarted = [
  { step: 'Create Competition', detail: 'Set up a new competition.' },
  { step: 'Register Teams', detail: 'Add the participating teams.' },
  { step: 'Generate Fixtures', detail: 'Build the match schedule.' },
  { step: 'Record Results', detail: 'Enter results as they happen.' },
]

export default function HomePage() {
  return (
    <>
      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            SportsHub
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            The simple way to manage your competitions, teams, and players from
            kick-off to the final whistle.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/competitions"
              className="w-full rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 sm:w-auto"
            >
              Explore Competitions
            </Link>
            <Link
              to="/login"
              className="w-full rounded-lg border border-slate-600 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <PageContainer>
        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="mb-8 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Everything your league needs
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="getting-started-heading" className="mt-20">
          <h2 id="getting-started-heading" className="mb-8 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Getting started
          </h2>
          <ol className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {gettingStarted.map((item, index) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.step}</p>
                  <p className="text-sm text-slate-600">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </PageContainer>
    </>
  )
}