type FilterLike = {
  key: string
  values: string[]
}

/**
 * Returns true when at least one filter value present on the originally-loaded
 * metric is no longer present in the current form values.
 *
 * A value counts as removed when a loaded filter key had value V and the current
 * form no longer has V under that key. This covers three destructive edits that
 * can collapse existing plan charge filters:
 * - a value removed from an existing key
 * - a whole key removed (all its values disappear)
 * - a key renamed (the old key's values are gone)
 */
export const hasRemovedFilterValues = (
  original?: FilterLike[] | null,
  current?: FilterLike[] | null,
): boolean =>
  (original ?? []).some((orig) => {
    const match = (current ?? []).find((filter) => filter.key === orig.key)
    const currentValues = match?.values ?? []

    return (orig.values ?? []).some((value) => !currentValues.includes(value))
  })
