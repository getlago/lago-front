import { getCustomerPortalToken } from '~/core/router/utils/getCustomerPortalToken'

export const isCustomerPortalPath = (pathname: string): boolean =>
  !!getCustomerPortalToken(pathname)
