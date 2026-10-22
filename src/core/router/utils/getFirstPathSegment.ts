const PATH_SEGMENT_SEPARATOR = /[/?#]/

export const getFirstPathSegment = (path: string): string | undefined => {
  if (!path.startsWith('/')) return undefined

  return path.slice(1).split(PATH_SEGMENT_SEPARATOR)[0] || undefined
}
