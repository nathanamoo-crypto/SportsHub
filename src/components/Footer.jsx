import { Link } from 'react-router-dom'

const footerLinks = [
  { label: 'Home', to: '/' },
  { label: 'Competitions', to: '/competitions' },
  { label: 'Teams', to: '/teams' },
  { label: 'Players', to: '/players' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-bold text-slate-900">
            SportsHub
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Manage your competitions, teams, and players in one place.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SportsHub. All rights reserved.
      </div>
    </footer>
  )
}