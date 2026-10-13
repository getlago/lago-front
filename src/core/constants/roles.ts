import { GetRoleQuery, GetRolesListQuery } from '~/generated/graphql'

export const MEMBERS_PAGE_ROLE_FILTER_KEY = 'roles'
export const rolesNameMapping = {
  Admin: 'text_664f035a68227f00e261b7ee',
  Manager: 'text_664f035a68227f00e261b7f0',
  Finance: 'text_664f035a68227f00e261b7f2',
}

export const rolesDescriptionMapping = {
  Admin: 'text_1767027068946xgqsb9x6z3c',
  Manager: 'text_1767027068946er3mwgop2xm',
  Finance: 'text_1767027068946errhztv7v4w',
}

export const systemRoles = Object.keys(rolesNameMapping)

export type SystemRoleKey = keyof typeof rolesNameMapping

// Matched by code, which the API reserves. The name fallback (membership roles only expose
// names) can still match legacy custom roles created before names were reserved.
export const getSystemRoleKey = (role: {
  name: string
  code?: string | null
}): SystemRoleKey | undefined => {
  if (role.code) {
    return systemRoles.find((key) => key.toLowerCase() === role.code) as SystemRoleKey | undefined
  }

  return systemRoles.includes(role.name) ? (role.name as SystemRoleKey) : undefined
}

export const isSystemRole = (role: { name: string; code?: string | null }): boolean =>
  !!getSystemRoleKey(role)

export type RoleItem = GetRolesListQuery['roles'][0] | NonNullable<GetRoleQuery['role']>
