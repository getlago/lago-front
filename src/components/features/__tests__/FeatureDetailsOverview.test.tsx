import { act, render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SHOW_MORE_TEXT_BUTTON_TEST_ID } from '~/components/designSystem/ShowMoreText'
import { GetFeatureForDetailsOverviewDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { FeatureDetailsOverview } from '../FeatureDetailsOverview'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const featureFixture = {
  __typename: 'FeatureObject',
  id: 'feat-1',
  name: 'Seats',
  code: 'seats',
  description: 'Number of seats',
  privileges: [],
}

const UNBREAKABLE_DESCRIPTION = 'a'.repeat(500)

const overviewQueryMockFactory = (feature: Record<string, unknown>) => ({
  request: { query: GetFeatureForDetailsOverviewDocument, variables: { id: 'feat-1' } },
  result: { data: { feature } },
})

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderOverview = (feature: Record<string, unknown> = featureFixture) =>
  rtlRender(<FeatureDetailsOverview />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[overviewQueryMockFactory(feature)]}
        useParams={{ featureId: 'feat-1' }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('FeatureDetailsOverview', () => {
  describe('GIVEN a feature with a short description', () => {
    describe('WHEN the overview loads', () => {
      it('THEN displays the name, code and description', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('Seats')).toBeInTheDocument()
        expect(screen.getByText('seats')).toBeInTheDocument()
        expect(screen.getByText('Number of seats')).toBeInTheDocument()
        expect(screen.queryByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a feature without a description', () => {
    describe('WHEN the overview loads', () => {
      it('THEN omits the description row', async () => {
        await act(() => renderOverview({ ...featureFixture, description: null }))

        await screen.findByText('Seats')

        expect(screen.queryByText('text_6388b923e514213fed58331c')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a description longer than the display limit', () => {
    describe('WHEN the overview loads', () => {
      it('THEN truncates it behind a "See more" button', async () => {
        await act(() => renderOverview({ ...featureFixture, description: UNBREAKABLE_DESCRIPTION }))

        await screen.findByText('Seats')

        expect(screen.queryByText(UNBREAKABLE_DESCRIPTION)).not.toBeInTheDocument()
        expect(screen.getByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN "See more" is clicked', () => {
      it('THEN reveals the whole description, wrapping mid-word', async () => {
        await act(() => renderOverview({ ...featureFixture, description: UNBREAKABLE_DESCRIPTION }))

        await screen.findByText('Seats')
        await userEvent.click(screen.getByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID))

        expect(screen.getByText(UNBREAKABLE_DESCRIPTION)).toHaveClass('line-break-anywhere')
      })
    })
  })
})
