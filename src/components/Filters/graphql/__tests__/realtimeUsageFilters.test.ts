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

  describe('auto-refresh', () => {
    it('shows the interval, or Off', () => {
      const translate = (key: string): string =>
        key === 'text_1787609843960bopfeje8bho' ? 'Off' : key

      expect(formatActiveFilterValueDisplay(AvailableFiltersEnum.autoRefresh, '5', translate)).toBe(
        '5s',
      )
      expect(formatActiveFilterValueDisplay(AvailableFiltersEnum.autoRefresh, '0', translate)).toBe(
        'Off',
      )
    })
  })

  describe('time range', () => {
    it('shows the preset label, or the bounds of a custom range', () => {
      const translate = (key: string): string =>
        key === 'text_1792500580727gdsaipakh25' ? 'Last 24h' : key

      expect(
        formatActiveFilterValueDisplay(AvailableFiltersEnum.timeRange, 'last_24h', translate),
      ).toBe('Last 24h')
      expect(
        formatActiveFilterValueDisplay(
          AvailableFiltersEnum.timeRange,
          '2026-08-01T12:00:00.000Z,2026-08-07T12:00:00.000Z',
          translate,
        ),
      ).toBe('Aug 1, 2026 - Aug 7, 2026')
    })
  })
})
