import { useState } from 'react'

import { allRoles } from './mock/allRoles'

import { RoleItem } from '../common/roleTypes'

export const useRolesList = () => {
  // Placeholder right now, will be replaced by actual logic later
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [roles, setRoles] = useState<RoleItem[]>([])

  setTimeout(() => {
    setIsLoadingRoles(false)
    setRoles(allRoles)
  }, 1000)

  return {
    roles,
    isLoadingRoles,
  }
}
