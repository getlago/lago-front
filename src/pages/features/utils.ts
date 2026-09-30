export const findFirstPrivilegeIndexWithDuplicateCode = (
  privileges: Array<{ code: string }>,
): number => {
  return privileges.findLastIndex((privilege, index) =>
    privileges.some((p, i) => {
      return p.code === privilege.code && i !== index
    }),
  )
}
