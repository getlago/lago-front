import { render, screen } from '@testing-library/react'

import { FiltersItemTimeRange } from '~/components/Filters/graphql/filtersElements/FiltersItemTimeRange'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ timezoneConfig: { name: 'UTC' } }),
}))

const renderComponent = (value?: string) =>
  render(<FiltersItemTimeRange value={value} setFilterValue={jest.fn()} />, {
    wrapper: (props) => <AllTheProviders {...props} />,
  })

describe('FiltersItemTimeRange', () => {
  describe('GIVEN a preset', () => {
    it('THEN only offers the presets combobox', () => {
      renderComponent('last_24h')

      expect(screen.getAllByRole('combobox')).toHaveLength(1)
    })
  })

  describe('GIVEN a custom range', () => {
    it('THEN also renders its date fields', () => {
      renderComponent('2026-08-01T00:00:00.000Z,2026-08-07T23:59:59.000Z')

      expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(2)
    })
  })
})
