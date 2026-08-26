import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { GetRateCardForDetailsDocument, RateCardBillingTimingEnum } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import RateCardDetails, {
  RATE_CARD_DETAILS_ACTIONS_TEST_ID,
  RATE_CARD_DETAILS_DELETE_TEST_ID,
  RATE_CARD_DETAILS_EDIT_TEST_ID,
} from '../RateCardDetails'

const mockOpenEditRateCardDrawer = jest.fn()
const mockOpenDeleteRateCardDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/pages/catalog/drawers/rateCard/useRateCardDrawer', () => ({
  useRateCardDrawer: () => ({ openDrawer: mockOpenEditRateCardDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteRateCardDialog', () => ({
  useDeleteRateCardDialog: () => ({
    openDeleteRateCardDialog: mockOpenDeleteRateCardDialog,
  }),
}))

jest.mock('../RateCardDetailsOverview', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../RateCardActivityLogs', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const rateCardFixture = {
  __typename: 'RateCard',
  id: 'rc-1',
  name: 'Standard rate card',
  code: 'standard_rate_card',
  description: 'The standard rate card',
  currency: 'USD',
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  displayOnInvoice: true,
  regroupPaidFees: null,
  proration: false,
  walletTargetable: false,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
  product: {
    __typename: 'Product',
    id: 'pitem-1',
    name: 'Seats',
    code: 'seats',
    productType: 'usage',
    billableMetric: {
      __typename: 'BillableMetric',
      id: 'bm-1',
      name: 'Seats used',
      code: 'seats_used',
      aggregationType: 'count_agg',
      recurring: false,
    },
  },
  productFilter: null,
}

const detailsQueryMock = {
  request: { query: GetRateCardForDetailsDocument, variables: { id: 'rc-1' } },
  result: { data: { rateCard: rateCardFixture } },
}

const RateCardDetailsWithHeader = () => (
  <>
    <MainHeader />
    <RateCardDetails />
  </>
)

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderPage = () =>
  rtlRender(<RateCardDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[detailsQueryMock]}
        useParams={{ rateCardId: 'rc-1', tab: 'overview' }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('RateCardDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
    window.history.pushState({}, '', '/')
  })

  it('displays the rate card name and code in the header once loaded', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
        'Standard rate card',
      )
    })
    expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent(
      'standard_rate_card',
    )
  })

  it('renders the catalog breadcrumb link and the static grey rate card crumb', async () => {
    await act(() => renderPage())

    const catalogCrumb = await screen.findByRole('link', {
      name: 'text_1783019143196z1oi70j03vt',
    })

    expect(catalogCrumb).toHaveAttribute('href', '/product-catalog/rate-cards')
  })

  it('shows the overview, rates, plans and activity logs tabs', async () => {
    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.getByText('text_1784930705742tg0kbcsak2v')).toBeInTheDocument()
    expect(screen.getByText('text_62442e40cea25600b0b6d85a')).toBeInTheDocument()
    expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
  })

  it('shows the activity logs tab when premium and permitted', async () => {
    mockIsPremium = true
    mockHasPermissions.mockReturnValue(true)

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
  })

  it('hides the activity logs tab without premium', async () => {
    mockIsPremium = false

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
  })

  it('hides the activity logs tab without the auditLogsView permission', async () => {
    mockHasPermissions.mockImplementation(
      (permissions: string[]) => !permissions.includes('auditLogsView'),
    )

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
  })

  it('renders the rates tab stub content when that tab is active', async () => {
    window.history.pushState({}, '', '/product-catalog/rate-cards/rc-1/rates')

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByText('text_1784930705742tg0kbcsak2v')).toHaveLength(2)
    })
  })

  it('renders the plans tab stub content when that tab is active', async () => {
    window.history.pushState({}, '', '/product-catalog/rate-cards/rc-1/plans')

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByText('text_62442e40cea25600b0b6d85a')).toHaveLength(2)
    })
  })

  it('opens the edit drawer with the loaded rate card from the actions dropdown', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId(RATE_CARD_DETAILS_ACTIONS_TEST_ID))[0])
    await userEvent.click(screen.getByTestId(RATE_CARD_DETAILS_EDIT_TEST_ID))

    expect(mockOpenEditRateCardDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        rateCard: expect.objectContaining({ id: 'rc-1', code: 'standard_rate_card' }),
      }),
    )
  })

  it('opens the delete dialog whose callback navigates back to the rate cards list', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId(RATE_CARD_DETAILS_ACTIONS_TEST_ID))[0])
    await userEvent.click(screen.getByTestId(RATE_CARD_DETAILS_DELETE_TEST_ID))

    expect(mockOpenDeleteRateCardDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        rateCard: expect.objectContaining({ id: 'rc-1' }),
      }),
    )

    const { callback } = mockOpenDeleteRateCardDialog.mock.calls[0][0]

    callback()

    expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/rate-cards')
  })

  it('hides the whole actions dropdown without the update and delete permissions', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
        'Standard rate card',
      )
    })
    expect(screen.queryByTestId(RATE_CARD_DETAILS_ACTIONS_TEST_ID)).not.toBeInTheDocument()
  })

  it('redirects to the rate cards list when the rate card is not found', async () => {
    const notFoundMock = {
      request: { query: GetRateCardForDetailsDocument, variables: { id: 'rc-1' } },
      result: {
        errors: [
          {
            message: 'Resource not found',
            extensions: { code: 'not_found' },
          },
        ],
      },
    }

    await act(() =>
      rtlRender(<RateCardDetailsWithHeader />, {
        wrapper: ({ children }) => (
          <AllTheProviders
            forceTypenames
            mocks={[notFoundMock]}
            useParams={{ rateCardId: 'rc-1', tab: 'overview' }}
          >
            {children}
          </AllTheProviders>
        ),
      }),
    )

    await waitFor(() => {
      expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/rate-cards', {
        replace: true,
      })
    })
  })
})
