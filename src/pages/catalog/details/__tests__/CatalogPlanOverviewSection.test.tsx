import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetCatalogPlanForDetailsOverviewDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID,
  CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID,
  CatalogPlanOverviewSection,
} from '../CatalogPlanOverviewSection'

const mockOpenEditCatalogPlanDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('../../drawers/catalogPlan/useCatalogPlanDrawer', () => ({
  useCatalogPlanDrawer: () => ({ openDrawer: mockOpenEditCatalogPlanDrawer }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ catalogPlanId: 'plan-1' }),
}))

const buildMock = (
  appliedRateCardsCount: number,
  description: string | null = 'A description',
) => ({
  request: {
    query: GetCatalogPlanForDetailsOverviewDocument,
    variables: { id: 'plan-1' },
  },
  result: {
    data: {
      catalogPlan: {
        __typename: 'CatalogPlan',
        id: 'plan-1',
        name: 'Premium',
        code: 'premium',
        currency: 'USD',
        description,
        invoiceDisplayName: 'Cards',
        appliedRateCardsCount,
        attachedToContracts: false,
      },
    },
  },
})

const renderSection = (
  appliedRateCardsCount = 0,
  description: string | null = 'A description',
): void => {
  render(<CatalogPlanOverviewSection />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={[buildMock(appliedRateCardsCount, description)]}>
        {children}
      </AllTheProviders>
    ),
  })
}

describe('CatalogPlanOverviewSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  it('GIVEN a plan THEN renders every info grid value', async () => {
    renderSection()

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.getByText('premium')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('Cards')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('GIVEN no description THEN hides the description row', async () => {
    renderSection(0, null)

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.queryByText('text_6388b923e514213fed58331c')).not.toBeInTheDocument()
  })

  it('GIVEN update permission THEN offers Edit plan', async () => {
    renderSection()

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID)).toBeInTheDocument(),
    )
  })

  it('GIVEN a click on Edit plan THEN opens the drawer seeded with the plan', async () => {
    renderSection()

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID)).toBeInTheDocument(),
    )
    await userEvent.click(screen.getByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID))

    expect(mockOpenEditCatalogPlanDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'plan-1', code: 'premium' }),
    )
  })

  it('GIVEN no update permission THEN hides Edit plan', async () => {
    mockHasPermissions.mockReturnValue(false)
    renderSection()

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.queryByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN no rate card THEN offers the quick action', async () => {
    renderSection(0)

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID)).toBeInTheDocument(),
    )
    expect(screen.getByText('text_17890300495307orirxcvgn8')).toBeInTheDocument()
  })

  it('GIVEN existing rate cards THEN hides the quick action', async () => {
    renderSection(2)

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(
      screen.queryByTestId(CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('text_17890300495307orirxcvgn8')).not.toBeInTheDocument()
  })
})
