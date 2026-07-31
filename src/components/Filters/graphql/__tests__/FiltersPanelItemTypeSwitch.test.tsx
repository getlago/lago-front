import { render, screen } from '@testing-library/react'

import {
  FILTERS_PANEL_ITEM_TYPE_SWITCH_DATE_HELP_TEST_ID,
  FILTERS_PANEL_ITEM_TYPE_SWITCH_HELP_TEST_ID,
  FILTERS_PANEL_ITEM_TYPE_SWITCH_PLACEHOLDER_TEST_ID,
  FiltersPanelItemTypeSwitch,
} from '~/components/Filters/graphql/FiltersPanelItemTypeSwitch'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { AllTheProviders } from '~/test-utils'

const STATUS_CHILD_TEST_ID = 'mock-filters-item-status'
const ISSUING_DATE_CHILD_TEST_ID = 'mock-filters-item-issuing-date'
const METADATA_CHILD_TEST_ID = 'mock-filters-item-metadata'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/Filters/graphql/filtersElements/FiltersItemStatus', () => ({
  FiltersItemStatus: () => <div data-test="mock-filters-item-status" />,
}))

jest.mock('~/components/Filters/graphql/filtersElements/FiltersItemIssuingDate', () => ({
  FiltersItemIssuingDate: () => <div data-test="mock-filters-item-issuing-date" />,
}))

jest.mock('~/components/Filters/graphql/filtersElements/FiltersItemMetadata', () => ({
  FiltersItemMetadata: () => <div data-test="mock-filters-item-metadata" />,
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (filterType?: AvailableFiltersEnum): void => {
  render(
    <FiltersPanelItemTypeSwitch
      filterType={filterType}
      value=""
      setFilterValue={mockSetFilterValue}
    />,
    { wrapper: AllTheProviders },
  )
}

describe('FiltersPanelItemTypeSwitch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no filter type is provided', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the placeholder', () => {
        renderComponent(undefined)

        expect(
          screen.getByTestId(FILTERS_PANEL_ITEM_TYPE_SWITCH_PLACEHOLDER_TEST_ID),
        ).toBeInTheDocument()
      })

      it.each([
        ['date help', FILTERS_PANEL_ITEM_TYPE_SWITCH_DATE_HELP_TEST_ID],
        ['generic help', FILTERS_PANEL_ITEM_TYPE_SWITCH_HELP_TEST_ID],
      ])('THEN should not display the %s text', (_, testId) => {
        renderComponent(undefined)

        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a date filter type', () => {
    describe('WHEN the filter type is issuingDate', () => {
      it('THEN should display the date help text', () => {
        renderComponent(AvailableFiltersEnum.issuingDate)

        expect(
          screen.getByTestId(FILTERS_PANEL_ITEM_TYPE_SWITCH_DATE_HELP_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN should not display the generic help text', () => {
        renderComponent(AvailableFiltersEnum.issuingDate)

        expect(
          screen.queryByTestId(FILTERS_PANEL_ITEM_TYPE_SWITCH_HELP_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should render the mapped date filter item', () => {
        renderComponent(AvailableFiltersEnum.issuingDate)

        expect(screen.getByTestId(ISSUING_DATE_CHILD_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the metadata filter type', () => {
    describe('WHEN the component renders', () => {
      it.each([
        ['date help', FILTERS_PANEL_ITEM_TYPE_SWITCH_DATE_HELP_TEST_ID],
        ['generic help', FILTERS_PANEL_ITEM_TYPE_SWITCH_HELP_TEST_ID],
      ])('THEN should not display the %s text', (_, testId) => {
        renderComponent(AvailableFiltersEnum.metadata)

        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      })

      it('THEN should render the mapped metadata filter item', () => {
        renderComponent(AvailableFiltersEnum.metadata)

        expect(screen.getByTestId(METADATA_CHILD_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a generic filter type', () => {
    describe('WHEN the filter type is status', () => {
      it('THEN should display the generic help text', () => {
        renderComponent(AvailableFiltersEnum.status)

        expect(screen.getByTestId(FILTERS_PANEL_ITEM_TYPE_SWITCH_HELP_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not display the date help text', () => {
        renderComponent(AvailableFiltersEnum.status)

        expect(
          screen.queryByTestId(FILTERS_PANEL_ITEM_TYPE_SWITCH_DATE_HELP_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should render the mapped filter item', () => {
        renderComponent(AvailableFiltersEnum.status)

        expect(screen.getByTestId(STATUS_CHILD_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
