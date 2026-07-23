import { filterDataInlineSeparator } from '../types'
import { unescapeFilterLabel } from '../utils'

/**
 * Parses a comma-separated filter value string into an array of { value } objects
 * for use with MultipleComboBox components.
 */
export const parseMultiFilterValue = (value?: string): { value: string }[] =>
  (value || '')
    .split(',')
    .filter((v) => !!v)
    .map((v) => ({ value: v }))

/**
 * Parses a comma-separated filter value string into MultipleComboBox options,
 * decoding each entry's inline label (`id${filterDataInlineSeparator}label`) back
 * into a human-readable, comma-safe label.
 *
 * When an entry equals `withoutValue` (a client-only sentinel such as the pinned
 * "Not defined" option), its label is taken from `withoutValueLabel` verbatim
 * instead of being decoded.
 */
export const parseLabeledMultiFilterValue = ({
  value,
  withoutValue,
  withoutValueLabel,
}: {
  value?: string
  withoutValue?: string
  withoutValueLabel?: string
}): { label: string; value: string }[] =>
  (value ?? '')
    .split(',')
    .filter((v) => !!v)
    .map((v) => ({
      label:
        withoutValue !== undefined && withoutValueLabel !== undefined && v === withoutValue
          ? withoutValueLabel
          : unescapeFilterLabel(
              v.split(filterDataInlineSeparator)[1] || v.split(filterDataInlineSeparator)[0],
            ),
      value: v,
    }))

/**
 * Formats an array of { value } objects back into a comma-separated string
 * for filter state storage.
 */
export const formatMultiFilterValue = (items: { value: string }[]): string =>
  items.map((v) => v.value).join(',')
