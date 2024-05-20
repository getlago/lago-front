import type { RouteObject } from 'react-router-dom'

import { TMembershipPermissions } from '~/hooks/usePermissions'

export interface CustomRouteObject extends Omit<RouteObject, 'children' | 'path'> {
  path?: string | string[]
  private?: boolean
  onlyPublic?: boolean
  invitation?: boolean
  redirect?: string
  children?: CustomRouteObject[]
  permissions?: Array<keyof TMembershipPermissions>
}
