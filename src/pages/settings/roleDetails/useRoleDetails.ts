import { useState } from 'react'

import { allRoles } from '../rolesList/mock/allRoles'
import { type RoleItem } from '../rolesList/useRolesList'

export const useRoleDetails = ({
  roleId,
}: {
  roleId: string | undefined
}): { role: RoleItem | undefined; isLoadingRole: boolean } => {
  // Placeholder right now, will be replaced by actual logic later
  const [isLoadingRole, setIsLoadingRole] = useState(true)
  const [role, setRole] = useState<RoleItem | undefined>(undefined)

  setTimeout(() => {
    const foundRole = allRoles.find((r) => r.id === roleId)

    setIsLoadingRole(false)
    setRole(foundRole)
    //
  }, 1000)

  return {
    role,
    isLoadingRole,
  }
}
