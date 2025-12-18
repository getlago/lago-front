import { PermissionName } from './permissionsTypes'

type Member = {
  id: string
  name: string
  email: string
}

export type RoleItem = {
  id: string
  organization: null
  name: string
  description: string
  admin: boolean
  deletedAt: null
  members: Array<Member>
  permissions: Array<PermissionName>
}
