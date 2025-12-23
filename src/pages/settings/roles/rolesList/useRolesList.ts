import { useState } from 'react'

import { addToast } from '~/core/apolloClient/reactiveVars/toastVar'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { allRoles } from './mock/allRoles'

import { RoleItem } from '../common/roleTypes'

export const useRolesList = () => {
  const { translate } = useInternationalization()
  // Placeholder right now, will be replaced by actual logic later
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [roles, setRoles] = useState<RoleItem[]>([])

  setTimeout(() => {
    setIsLoadingRoles(false)
    setRoles(allRoles)
  }, 1000)

  const deleteRole = (roleId: string) => {
    // Do nothing for now
    addToast({
      message: translate('text_1766158947598m8ut1nw2vjq'),
      severity: 'success',
    })
    return roleId
  }

  return {
    roles,
    isLoadingRoles,
    deleteRole,
  }
}
