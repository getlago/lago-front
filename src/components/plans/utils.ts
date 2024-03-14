export const transformFilterObjectToString = (key: string, value?: string): string => {
  return `{ "${[key]}": "${value || '__ALL_FILTER_VALUES__'}" }`
}
