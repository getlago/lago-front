import { PermissionEnum } from '~/generated/graphql'

export type PermissionName = keyof typeof PermissionEnum

export type PermissionItem = {
  name: PermissionName
  description: string
}

export type PermissionGroupingItem = {
  name: string
  displayName: string
  permissions: Array<PermissionItem>
}

export type PermissionGroupMapping = Record<string, Array<PermissionName>>

export type PermissionGrouping = Record<string, PermissionGroupingItem>
