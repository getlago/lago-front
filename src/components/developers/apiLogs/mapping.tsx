import { TypographyColor } from 'lago-design-system'

import { HttpMethodEnum } from '~/generated/graphql'

export const variantByHTTPMethod = (method: HttpMethodEnum): TypographyColor => {
  switch (method) {
    case HttpMethodEnum.Post:
      return 'primary600'
    case HttpMethodEnum.Put:
      return 'warning700'
    case HttpMethodEnum.Delete:
      return 'danger600'
    default:
      return 'grey700'
  }
}
