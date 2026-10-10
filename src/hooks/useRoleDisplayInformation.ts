import {
  RoleItem,
  rolesDescriptionMapping,
  rolesNameMapping,
  systemRoles,
} from '~/core/constants/roles'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export type AllowedElements = RoleItem | undefined | { name: string; description?: string }

type SystemRoleKey = keyof typeof rolesNameMapping

// Predefined roles are identified by their code, which custom roles cannot reuse.
// Callers that only have a name (membership roles) fall back to the name, since
// the API rejects custom roles named like a predefined one.
const getSystemRoleKey = (role: NonNullable<AllowedElements>): SystemRoleKey | undefined => {
  if ('code' in role && role.code) {
    return systemRoles.find((key) => key.toLowerCase() === role.code) as SystemRoleKey | undefined
  }

  return systemRoles.includes(role.name) ? (role.name as SystemRoleKey) : undefined
}

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
