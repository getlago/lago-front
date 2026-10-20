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

  it('maps a subscription to its external id', () => {
    expect(
      FILTER_VALUE_MAP[AvailableFiltersEnum.realtimeSubscription](
        `sub_1${filterDataInlineSeparator}sub_1 - Acme`,
      ),
    ).toBe('sub_1')
  })
})
