import { useState } from 'react'

import { systemRoles } from '../common/rolesConst'
import { type RoleItem } from '../common/roleTypes'
import { allRoles } from '../rolesList/mock/allRoles'

export const useRoleDetails = ({
  roleId,
}: {
  roleId: string | undefined
}): {
  role: RoleItem | undefined
  isLoadingRole: boolean
  canBeEdited: boolean
  canBeDeleted: boolean
} => {
  // Placeholder right now, will be replaced by actual logic later
  const [isLoadingRole, setIsLoadingRole] = useState(true)
  const [role, setRole] = useState<RoleItem | undefined>(undefined)
  const [canBeEdited, setCanBeEdited] = useState(false)
  const [canBeDeleted, setCanBeDeleted] = useState(false)

  setTimeout(() => {
    const foundRole = allRoles.find((r) => r.id === roleId)

    if (!foundRole) return

    setIsLoadingRole(false)
    setRole(foundRole)

    if (systemRoles.includes(foundRole.name)) {
      setCanBeEdited(false)
      setCanBeDeleted(false)
      return
    }

    setCanBeEdited(true)
    setCanBeDeleted(foundRole.members.length === 0)
  }, 1000)

  return {
    role,
    isLoadingRole,
    canBeEdited,
    canBeDeleted,
  }
}
