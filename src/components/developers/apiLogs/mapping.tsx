import { TypographyColor } from 'lago-design-system'

export enum HTTPMethod {
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export const variantByHTTPMethod = (method: HTTPMethod): TypographyColor => {
  switch (method) {
    case HTTPMethod.POST:
      return 'primary600'
    case HTTPMethod.PUT:
      return 'warning700'
    case HTTPMethod.DELETE:
      return 'danger600'
  }
}
