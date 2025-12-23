import { useInternationalization } from '~/hooks/core/useInternationalization'

import { rolesNameMapping, systemRoles } from './rolesConst'
import { RoleItem } from './roleTypes'

export const useRoleDisplayName = () => {
  const { translate } = useInternationalization()

  const getDisplayName = (role: RoleItem | undefined) => {
    if (!role) return ''

    return systemRoles.includes(role.name)
      ? translate(rolesNameMapping[role.name as keyof typeof rolesNameMapping])
      : role.name
  }

  return {
    getDisplayName,
  }
}
