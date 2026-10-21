import {
  AvailableFiltersEnum,
  filterDataInlineSeparator,
} from '~/components/Filters/presentation/types'

import {
  encodeRealtimeDimensionKey,
  escapeFilterLabel,
  FILTER_VALUE_MAP,
  formatActiveFilterValueDisplay,
} from '../utils'

describe('real-time usage filters', () => {
  describe('dimensions', () => {
    const key = '{"region":["eu","us"]}\u001f{"model":"opus"}'
    const value = [
      `${encodeRealtimeDimensionKey(key)}${filterDataInlineSeparator}${escapeFilterLabel('eu, us')}`,
      `${encodeRealtimeDimensionKey('\u001f')}${filterDataInlineSeparator}Default`,
    ].join(',')

    it('survives the comma-separated filter value with its JSON key intact', () => {
      expect(FILTER_VALUE_MAP[AvailableFiltersEnum.realtimeDimensions](value)).toEqual([
        key,
        '\u001f',
      ])
    })

    it('shows the dimension names in the active filter', () => {
      expect(formatActiveFilterValueDisplay(AvailableFiltersEnum.realtimeDimensions, value)).toBe(
        'eu, us, Default',
      )
    })
  })

  describe('subscription', () => {
    const value = `sub_1${filterDataInlineSeparator}sub_1 - Acme`

    it('queries the external id only', () => {
      expect(FILTER_VALUE_MAP[AvailableFiltersEnum.subscriptionExternalId](value)).toBe('sub_1')
    })

    it('shows the label, or the bare id of a value typed before the combobox', () => {
      expect(
        formatActiveFilterValueDisplay(AvailableFiltersEnum.subscriptionExternalId, value),
      ).toBe('sub_1 - Acme')
      expect(
        formatActiveFilterValueDisplay(AvailableFiltersEnum.subscriptionExternalId, 'sub_old_1'),
      ).toBe('sub_old_1')
    })
  })
})
