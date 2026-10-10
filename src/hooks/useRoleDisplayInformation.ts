import {
  getSystemRoleKey,
  RoleItem,
  rolesDescriptionMapping,
  rolesNameMapping,
} from '~/core/constants/roles'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export type AllowedElements = RoleItem | undefined | { name: string; description?: string }

export const useRoleDisplayInformation = (): {
  getDisplayName: (role: AllowedElements) => string
  getDisplayDescription: (role: AllowedElements) => string
} => {
  const { translate } = useInternationalization()

  const getDisplayName = (role: AllowedElements) => {
    if (!role) return ''

    const systemKey = getSystemRoleKey(role)

    return systemKey ? translate(rolesNameMapping[systemKey]) : role.name
  }

  const getDisplayDescription = (role: AllowedElements) => {
    if (!role) return ''

    const systemKey = getSystemRoleKey(role)

    if (systemKey) {
      return translate(rolesDescriptionMapping[systemKey])
    }

    return role.description ?? ''
  }

  return {
    getDisplayName,
    getDisplayDescription,
  }
}
