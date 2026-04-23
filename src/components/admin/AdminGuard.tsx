import { Navigate, Outlet } from 'react-router-dom'

import { useCurrentUser } from '~/hooks/useCurrentUser'

const AdminGuard = () => {
  const { currentUser, loading } = useCurrentUser()

  if (loading) return null

  if (!currentUser?.csAdmin) {
    return <Navigate to="/404" replace />
  }

  return <Outlet />
}

export default AdminGuard
