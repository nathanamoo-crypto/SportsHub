import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function OrganizerRoute({ children }) {
  const { user, roles, loading, rolesLoading } = useAuth()
  const location = useLocation()

  if (loading || rolesLoading) {
    return <LoadingSpinner label="Checking organizer access..." />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!roles.includes('organizer')) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}