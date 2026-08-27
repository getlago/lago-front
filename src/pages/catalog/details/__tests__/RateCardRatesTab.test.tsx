import { MockedResponse } from '@apollo/client/testing'
import { act, configure, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  RateCardRateForListFragment,
  RateCardRatesDocument,
  RateCardRateStatusEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { buildRateCardForRateDrawer, buildRateCardRate } from '../../__tests__/fixtures'
import RateCardRatesTab, {
  RATE_CARD_RATES_CREATE_TEST_ID,
  RATE_CARD_RATES_TAB_TEST_ID,
} from '../RateCardRatesTab'

configure({ testIdAttribute: 'data-test' })

const mockOpenRateDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/pages/catalog/drawers/rateCardRate/useRateCardRateDrawer', () => ({
  useRateCardRateDrawer: () => ({ openDrawer: mockOpenRateDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteRateCardRateDialog', () => ({
  useDeleteRateCardRateDialog: () => ({ openDeleteRateCardRateDialog: jest.fn() }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}|${Object.values(vars).join('|')}` : key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jan 20, 2026', time: '00:00' }),
  }),
}))

const rateCard = buildRateCardForRateDrawer()

const buildRow = (index: number): RateCardRateForListFragment =>
  buildRateCardRate({
    id: `rate-${index}`,
    code: `rate_01_${String(index).padStart(2, '0')}_2026`,
    status: index === 0 ? RateCardRateStatusEnum.Active : RateCardRateStatusEnum.Pending,
  })

const ratesQueryMock = (
  collection: RateCardRateForListFragment[],
  totalCount = collection.length,
  totalPages = 1,
): MockedResponse => ({
  request: {
    query: RateCardRatesDocument,
    variables: { rateCardId: 'rc-1', page: 1, limit: DEFAULT_PAGE_SIZE },
  },
  result: {
    data: {
      rateCardRates: {
        collection,
        metadata: { currentPage: 1, totalPages, totalCount },
      },
    },
  },
})

// `null` stands for "the parent card query has not resolved yet", which the tab must handle.
const renderTab = (mocks: MockedResponse[], card: typeof rateCard | null = rateCard) =>
  rtlRender(<RateCardRatesTab rateCardId="rc-1" rateCard={card} />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={mocks}>
        {children}
      </AllTheProviders>
    ),
  })

describe('RateCardRatesTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN the rate card has rates', () => {
    describe('WHEN the tab renders', () => {
      it('THEN lists a row per rate', async () => {
        await act(() => renderTab([ratesQueryMock([buildRow(0), buildRow(1)])]))

        await waitFor(() => expect(screen.getByText('rate_01_00_2026')).toBeInTheDocument())
        expect(screen.getByText('rate_01_01_2026')).toBeInTheDocument()
      })

      it('THEN shows the section container', async () => {
        await act(() => renderTab([ratesQueryMock([buildRow(0)])]))

        expect(screen.getByTestId(RATE_CARD_RATES_TAB_TEST_ID)).toBeInTheDocument()
      })

      it('THEN renders no search input, since the design has none', async () => {
        await act(() => renderTab([ratesQueryMock([buildRow(0)])]))

        await waitFor(() => expect(screen.getByText('rate_01_00_2026')).toBeInTheDocument())
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the rate card has no rate yet', () => {
    describe('WHEN the tab renders', () => {
      it('THEN shows the empty placeholder', async () => {
        await act(() => renderTab([ratesQueryMock([], 0)]))

        await waitFor(() =>
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument(),
        )
      })
    })
  })

  describe('GIVEN the user can create rates', () => {
    describe('WHEN the create action is used', () => {
      it('THEN opens the drawer seeded with the parent rate card', async () => {
        await act(() => renderTab([ratesQueryMock([buildRow(0)])]))

        await userEvent.click(screen.getByTestId(RATE_CARD_RATES_CREATE_TEST_ID))

        expect(mockOpenRateDrawer).toHaveBeenCalledWith({ rateCard })
      })
    })
  })

  describe('GIVEN the parent rate card has not loaded yet', () => {
    describe('WHEN the tab renders', () => {
      it('THEN still lists the rates, which only need the card id', async () => {
        await act(() => renderTab([ratesQueryMock([buildRow(0)])], null))

        await waitFor(() => expect(screen.getByText('rate_01_00_2026')).toBeInTheDocument())
      })

      it('THEN hides the create action until the card is known', async () => {
        await act(() => renderTab([ratesQueryMock([buildRow(0)])], null))

        await waitFor(() => expect(screen.getByText('rate_01_00_2026')).toBeInTheDocument())
        expect(screen.queryByTestId(RATE_CARD_RATES_CREATE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user cannot create rates', () => {
    describe('WHEN the tab renders', () => {
      it('THEN hides the create action', async () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('rateCardsCreate'),
        )

        await act(() => renderTab([ratesQueryMock([buildRow(0)])]))

        expect(screen.queryByTestId(RATE_CARD_RATES_CREATE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
