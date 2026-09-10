import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { CatalogPlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CurrencyEnum, GetCatalogPlanForDetailsDocument } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import CatalogPlanDetails from '../CatalogPlanDetails'

const EDIT_PLAN_KEY = 'text_1789030049528hmelti5lsxj'
const DELETE_PLAN_KEY = 'text_1789030049528pjeaakmg1nc'
const OVERVIEW_TAB_KEY = 'text_628cf761cbe6820138b8f2e4'
const SUBSCRIPTIONS_TAB_KEY = 'text_6250304370f0f700a8fdc28d'
const ACTIVITY_LOGS_TAB_KEY = 'text_1747314141347qq6rasuxisl'
const PLANS_BREADCRUMB_KEY = 'text_62442e40cea25600b0b6d85a'
const PLAN_BREADCRUMB_KEY = 'text_1789030049530nkyhqgwxpkt'

const mockOpenCatalogPlanDrawer = jest.fn()
const mockOpenDeleteCatalogPlanDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/pages/catalog/drawers/catalogPlan/useCatalogPlanDrawer', () => ({
  useCatalogPlanDrawer: () => ({ openDrawer: mockOpenCatalogPlanDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteCatalogPlanDialog', () => ({
  useDeleteCatalogPlanDialog: () => ({
    openDeleteCatalogPlanDialog: mockOpenDeleteCatalogPlanDialog,
  }),
}))

jest.mock('../CatalogPlanDetailsOverview', () => ({
  CatalogPlanDetailsOverview: () => <div data-test="overview-tab" />,
}))

const mockSubscriptionsProps = jest.fn()

jest.mock('../CatalogPlanSubscriptions', () => ({
  CatalogPlanSubscriptions: (props: Record<string, unknown>) => {
    mockSubscriptionsProps(props)
    return <div data-test="subscriptions-tab" />
  },
}))

const mockActivityLogsProps = jest.fn()

jest.mock('../CatalogPlanActivityLogs', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockActivityLogsProps(props)
    return <div data-test="activity-logs-tab" />
  },
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

const catalogPlanFixture = {
  __typename: 'CatalogPlan',
  id: 'plan-1',
  name: 'Premium',
  code: 'premium',
  currency: CurrencyEnum.Usd,
  description: 'A premium plan',
  invoiceDisplayName: 'Premium invoice name',
  appliedRateCardsCount: 2,
  contractsCount: 0,
  attachedToContracts: false,
}

const detailsQueryMock = {
  request: { query: GetCatalogPlanForDetailsDocument, variables: { id: 'plan-1' } },
  result: { data: { catalogPlan: catalogPlanFixture } },
}

const CatalogPlanDetailsWithHeader = () => (
  <>
    <MainHeader />
    <CatalogPlanDetails />
  </>
)

const renderPage = (
  tab: CatalogPlanDetailsTabsOptionsEnum = CatalogPlanDetailsTabsOptionsEnum.overview,
  section?: string,
) => {
  const sectionSuffix = section ? `/${section}` : ''

  window.history.pushState({}, '', `/plan-pricing/plan-1/${tab}${sectionSuffix}`)

  return rtlRender(<CatalogPlanDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[detailsQueryMock]}
        useParams={
          section ? { catalogPlanId: 'plan-1', tab, section } : { catalogPlanId: 'plan-1', tab }
        }
      >
        {children}
      </AllTheProviders>
    ),
  })
}

describe('CatalogPlanDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
  })

  it('displays the plan name and code in the header once loaded', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
        'Premium',
      )
    })
    expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent('premium')
  })

  it('renders the plans breadcrumb link and the static grey plan crumb', async () => {
    await act(() => renderPage())

    const plansCrumb = await screen.findByRole('link', { name: PLANS_BREADCRUMB_KEY })

    expect(plansCrumb).toHaveAttribute('href', '/plan-pricing')
    expect(screen.queryByRole('link', { name: PLAN_BREADCRUMB_KEY })).not.toBeInTheDocument()
    expect(screen.getByText(PLAN_BREADCRUMB_KEY)).toBeInTheDocument()
  })

  it('shows the overview, subscriptions and activity logs tabs for a premium user', async () => {
    await act(() => renderPage())

    expect(await screen.findByText(OVERVIEW_TAB_KEY)).toBeInTheDocument()
    expect(screen.getByText(SUBSCRIPTIONS_TAB_KEY)).toBeInTheDocument()
    expect(screen.getByText(ACTIVITY_LOGS_TAB_KEY)).toBeInTheDocument()
  })

  it('hides the activity logs tab without premium', async () => {
    mockIsPremium = false

    await act(() => renderPage())

    expect(await screen.findByText(OVERVIEW_TAB_KEY)).toBeInTheDocument()
    expect(screen.queryByText(ACTIVITY_LOGS_TAB_KEY)).not.toBeInTheDocument()
  })

  it('renders the overview tab content', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument()
    })
  })

  it('renders the subscriptions tab content scoped to the plan code', async () => {
    await act(() => renderPage(CatalogPlanDetailsTabsOptionsEnum.subscriptions))

    await waitFor(() => {
      expect(mockSubscriptionsProps).toHaveBeenCalledWith(
        expect.objectContaining({ planCode: 'premium' }),
      )
    })
  })

  it('renders the activity logs tab content scoped to the plan', async () => {
    await act(() => renderPage(CatalogPlanDetailsTabsOptionsEnum.activityLogs))

    await waitFor(() => {
      expect(mockActivityLogsProps).toHaveBeenCalledWith({ catalogPlanId: 'plan-1' })
    })
  })

  // The overview tab's `match` covers its own link plus `<link>/:section`: without both
  // entries a nested section URL falls through to the first visible tab instead.
  it('keeps the overview tab active on a nested rate-cards section URL', async () => {
    await act(() => renderPage(CatalogPlanDetailsTabsOptionsEnum.overview, 'rate-cards'))

    await waitFor(() => {
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('subscriptions-tab')).not.toBeInTheDocument()
  })

  it('opens the edit drawer with the loaded plan from the actions dropdown', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('catalog-plan-details-actions'))[0])
    await userEvent.click(screen.getByRole('button', { name: EDIT_PLAN_KEY }))

    expect(mockOpenCatalogPlanDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'plan-1', code: 'premium' }),
    )
  })

  it('opens the delete dialog whose callback navigates back to the plans list', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('catalog-plan-details-actions'))[0])
    await userEvent.click(screen.getByRole('button', { name: DELETE_PLAN_KEY }))

    expect(mockOpenDeleteCatalogPlanDialog).toHaveBeenCalledWith(
      expect.objectContaining({ catalogPlan: expect.objectContaining({ id: 'plan-1' }) }),
    )

    const { callback } = mockOpenDeleteCatalogPlanDialog.mock.calls[0][0]

    callback()

    expect(testMockNavigateFn).toHaveBeenCalledWith('/plan-pricing')
  })

  // `buildActionItems` (Task 6) always offers copy regardless of permissions, so the
  // dropdown itself stays visible; only edit and delete drop out.
  it('offers only the copy action without update or delete permissions', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('catalog-plan-details-actions'))[0])

    expect(screen.queryByRole('button', { name: EDIT_PLAN_KEY })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: DELETE_PLAN_KEY })).not.toBeInTheDocument()
  })
})
