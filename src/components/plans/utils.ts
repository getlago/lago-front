import { ALL_FILTER_VALUES } from '~/core/constants/form'

export const transformFilterObjectToString = (key: string, value?: string): string => {
  return `{ "${[key]}": "${value || ALL_FILTER_VALUES}" }`
}
