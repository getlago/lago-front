import { useReactiveVar } from '@apollo/client'

import {
  AdminRole,
  adminAuthTokenVar,
  adminEmailVar,
  adminRoleVar,
} from '~/core/apolloClient/reactiveVars/adminAuthTokenVar'

type UseIsAdminAuthenticatedReturn = () => {
  isAdminAuthenticated: boolean
  adminToken?: string
  adminRole?: AdminRole
  adminEmail?: string
  canWrite: boolean
}

export const useIsAdminAuthenticated: UseIsAdminAuthenticatedReturn = () => {
  const token = useReactiveVar(adminAuthTokenVar)
  const role = useReactiveVar(adminRoleVar)
  const email = useReactiveVar(adminEmailVar)

  return {
    isAdminAuthenticated: !!token,
    adminToken: token,
    adminRole: role,
    adminEmail: email,
    canWrite: role === 'admin',
  }
}
