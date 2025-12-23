import { Permissions } from '~/generated/graphql'

export type PermissionName = Exclude<keyof Permissions, '__typename'>

export type PermissionItem = {
  name: PermissionName
  description: string
  isReadPermission: boolean
}

export type PermissionGroupingItem = {
  name: string
  displayName: string
  permissions: Array<PermissionItem>
}

export type PermissionGroupMapping = Record<string, Array<PermissionName>>

export type PermissionGrouping = Record<string, PermissionGroupingItem>
