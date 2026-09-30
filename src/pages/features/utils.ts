// Validator errors sit directly on `errorMap.onDynamic`, keyed by field path
// (`privileges[0].code`); the `.fields` shape only exists for errors set manually.
export const firstErroredPrivilegeIndex = (
  errorMap: Record<string, unknown>,
): number | undefined => {
  const indexes = Object.entries(errorMap)
    .filter(([, error]) => !!error)
    .map(([key]) => key.match(/^privileges[[.](\d+)/)?.[1])
    .filter((index): index is string => index !== undefined)
    .map(Number)

  return indexes.length ? Math.min(...indexes) : undefined
}

export const findFirstPrivilegeIndexWithDuplicateCode = (
  privileges: Array<{ code: string }>,
): number => {
  return privileges.findLastIndex((privilege, index) =>
    privileges.some((p, i) => {
      return p.code === privilege.code && i !== index
    }),
  )
}
