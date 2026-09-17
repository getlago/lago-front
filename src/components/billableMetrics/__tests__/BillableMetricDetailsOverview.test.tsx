import { act, render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SHOW_MORE_TEXT_BUTTON_TEST_ID } from '~/components/designSystem/ShowMoreText'
import {
  AggregationTypeEnum,
  GetBillableMetricForDetailsOverviewDocument,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { BillableMetricDetailsOverview } from '../BillableMetricDetailsOverview'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const billableMetricFixture = {
  __typename: 'BillableMetric',
  id: 'bm-1',
  name: 'API calls',
  code: 'api_calls',
  description: 'Counts every API call',
  aggregationType: AggregationTypeEnum.CountAgg,
  fieldName: null,
  recurring: false,
  expression: null,
  weightedInterval: null,
  roundingFunction: null,
  roundingPrecision: null,
  filters: [],
}

const UNBREAKABLE_DESCRIPTION = 'a'.repeat(500)

const overviewQueryMockFactory = (billableMetric: Record<string, unknown>) => ({
  request: { query: GetBillableMetricForDetailsOverviewDocument, variables: { id: 'bm-1' } },
  result: { data: { billableMetric } },
})

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderOverview = (billableMetric: Record<string, unknown> = billableMetricFixture) =>
  rtlRender(<BillableMetricDetailsOverview />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[overviewQueryMockFactory(billableMetric)]}
        useParams={{ billableMetricId: 'bm-1' }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('BillableMetricDetailsOverview', () => {
  describe('GIVEN a billable metric with a short description', () => {
    describe('WHEN the overview loads', () => {
      it('THEN displays the name, code and description', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('API calls')).toBeInTheDocument()
        expect(screen.getByText('api_calls')).toBeInTheDocument()
        expect(screen.getByText('Counts every API call')).toBeInTheDocument()
        expect(screen.queryByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a billable metric without a description', () => {
    describe('WHEN the overview loads', () => {
      it('THEN omits the description row', async () => {
        await act(() => renderOverview({ ...billableMetricFixture, description: null }))

        await screen.findByText('API calls')

        expect(screen.queryByText('text_6388b923e514213fed58331c')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a description longer than the display limit', () => {
    describe('WHEN the overview loads', () => {
      it('THEN truncates it behind a "See more" button', async () => {
        await act(() =>
          renderOverview({ ...billableMetricFixture, description: UNBREAKABLE_DESCRIPTION }),
        )

        await screen.findByText('API calls')

        expect(screen.queryByText(UNBREAKABLE_DESCRIPTION)).not.toBeInTheDocument()
        expect(screen.getByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN "See more" is clicked', () => {
      it('THEN reveals the whole description, wrapping mid-word', async () => {
        await act(() =>
          renderOverview({ ...billableMetricFixture, description: UNBREAKABLE_DESCRIPTION }),
        )

        await screen.findByText('API calls')
        await userEvent.click(screen.getByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID))

        expect(screen.getByText(UNBREAKABLE_DESCRIPTION)).toHaveClass('line-break-anywhere')
      })
    })
  })
})
