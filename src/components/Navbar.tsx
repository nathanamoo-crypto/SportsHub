import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface NavItem {
  label: string
  to: string
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Competitions', to: '/competitions' },
  { label: 'Teams', to: '/teams' },
  { label: 'Players', to: '/players' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

const authNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Profile', to: '/profile' },
]

export default function Navbar() {
  const { user, roles, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const isOrganizer = user ? roles.includes('organizer') : false
  const closeMenu = () => setMenuOpen(false)

  const handleSignOut = () => {
    signOut()
    closeMenu()
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  const authLinks = user
    ? [
        ...authNavItems,
        ...(isOrganizer ? [{ label: 'Organizer', to: '/organizer' }] : []),
      ]
    : []

  const renderLink = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      onClick={closeMenu}
      className={navLinkClass}
    >
      {item.label}
    </NavLink>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Main navigation">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-2 text-lg font-bold text-slate-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 2" />
            </svg>
          </span>
          SportsHub
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map(renderLink)}
          {authLinks.map(renderLink)}
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="ml-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/register"
                className="ml-2 rounded-lg px-4 py-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="ml-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Login
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {menuOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {navItems.map(renderLink)}
            {authLinks.map(renderLink)}
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="mt-2 rounded-lg border border-brand-600 px-4 py-2 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}