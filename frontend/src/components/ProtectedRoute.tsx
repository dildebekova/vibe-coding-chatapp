import { Navigate, useLocation } from 'react-router-dom'

import { getAccessToken } from '../services/storage'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const token = getAccessToken()

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
