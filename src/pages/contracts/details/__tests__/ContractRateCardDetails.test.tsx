import { MockedResponse } from '@apollo/client/testing'
import { act, render as rtlRender, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  APPLIED_RATE_CARD_ID,
  buildContractAppliedRateCard,
  CATALOG_PLAN_ID,
  CONTRACT_ID,
} from '~/components/appliedRateCards/details/__tests__/fixtures'
import { APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY } from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import {
  APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID,
  APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID,
  APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID,
} from '~/components/appliedRateCards/details/AppliedRateCardDetailsView'
import { BREADCRUMB_NAV_TEST_ID } from '~/components/MainHeader/Breadcrumb'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'
import { addToast } from '~/core/apolloClient'
import {
  ContractAppliedRateCardForDetailsFragment,
  ContractStatusEnum,
  GetContractAppliedRateCardForDetailsDocument,
} from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import ContractRateCardDetails from '../ContractRateCardDetails'

// Every test mounts the whole page, so the default 5s budget is tight under parallel jest.
jest.setTimeout(15000)

const mockHasPermissions = jest.fn()

jest.mock('~/components/appliedRateCards/drawers/ratePhase/useRatePhaseDrawer', () => ({
  useRatePhaseDrawer: () => ({ openDrawer: jest.fn() }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useDeleteRatePhaseDialog', () => ({
  useDeleteRatePhaseDialog: () => ({ openDeleteRatePhaseDialog: jest.fn() }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useResetRatePhaseOverrideDialog', () => ({
  useResetRatePhaseOverrideDialog: () => ({ openResetRatePhaseOverrideDialog: jest.fn() }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useRemoveAppliedRateCardDialog', () => ({
  useRemoveAppliedRateCardDialog: () => ({ openRemoveAppliedRateCardDialog: jest.fn() }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const CONTRACT_RATE_CARDS_SECTION_PATH = `/contracts/${CONTRACT_ID}/overview/rate-cards`

const buildContract = (
  overrides: Partial<ContractAppliedRateCardForDetailsFragment['contract']> = {},
): ContractAppliedRateCardForDetailsFragment['contract'] => ({
  __typename: 'Contract',
  id: CONTRACT_ID,
  name: 'Acme contract',
  status: ContractStatusEnum.Pending,
  plan: { __typename: 'CatalogPlan', id: CATALOG_PLAN_ID, name: 'Enterprise plan' },
  ...overrides,
})

const detailsQueryMock = (card: ContractAppliedRateCardForDetailsFragment): MockedResponse => ({
  request: {
    query: GetContractAppliedRateCardForDetailsDocument,
    variables: { appliedRateCardId: APPLIED_RATE_CARD_ID },
  },
  result: { data: { contractAppliedRateCard: card } },
})

const notFoundQueryMock: MockedResponse = {
  request: {
    query: GetContractAppliedRateCardForDetailsDocument,
    variables: { appliedRateCardId: APPLIED_RATE_CARD_ID },
  },
  result: {
    errors: [{ message: 'Resource not found', extensions: { code: 'not_found' } }],
  },
}

const PageWithHeader = (): JSX.Element => (
  <>
    <MainHeader />
    <ContractRateCardDetails />
  </>
)

const renderPage = async (mocks: MockedResponse[]): Promise<void> => {
  await act(() =>
    rtlRender(<PageWithHeader />, {
      wrapper: ({ children }) => (
        <AllTheProviders
          forceTypenames
          mocks={mocks}
          useParams={{ id: CONTRACT_ID, appliedRateCardId: APPLIED_RATE_CARD_ID }}
        >
          {children}
        </AllTheProviders>
      ),
    }),
  )
}

const expectNotFoundRedirect = async (): Promise<void> => {
  await waitFor(() =>
    expect(testMockNavigateFn).toHaveBeenCalledWith(CONTRACT_RATE_CARDS_SECTION_PATH, {
      replace: true,
    }),
  )
  expect(addToast).toHaveBeenCalledWith({
    severity: 'info',
    translateKey: APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  })
}

describe('ContractRateCardDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN a card of an unnamed contract', () => {
    it('THEN names the parent crumb after the contract plan', async () => {
      await renderPage([
        detailsQueryMock(buildContractAppliedRateCard({ contract: buildContract({ name: null }) })),
      ])

      await waitFor(() =>
        expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
          'Standard rate card',
        ),
      )

      const parentCrumb = within(screen.getAllByTestId(BREADCRUMB_NAV_TEST_ID)[0]).getAllByRole(
        'link',
      )[1]

      expect(parentCrumb).toHaveTextContent('Enterprise plan')
      expect(parentCrumb).toHaveAttribute('href', CONTRACT_RATE_CARDS_SECTION_PATH)
      expect(testMockNavigateFn).not.toHaveBeenCalled()

      await userEvent.click(screen.getAllByTestId(APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID)[0])

      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID)).not.toBeDisabled()
      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID)).not.toBeDisabled()
    })
  })

  describe('GIVEN a contract that is no longer pending', () => {
    it('THEN create and remove are disabled', async () => {
      await renderPage([
        detailsQueryMock(
          buildContractAppliedRateCard({
            contract: buildContract({ status: ContractStatusEnum.Active }),
          }),
        ),
      ])

      await userEvent.click(
        (await screen.findAllByTestId(APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID))[0],
      )

      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID)).toBeDisabled()
      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID)).toBeDisabled()
    })
  })

  describe('GIVEN the card belongs to another contract than the URL', () => {
    it("THEN redirects to the URL contract's rate cards section with the not found toast", async () => {
      await renderPage([
        detailsQueryMock(
          buildContractAppliedRateCard({ contract: buildContract({ id: 'other-contract' }) }),
        ),
      ])

      await expectNotFoundRedirect()
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).not.toHaveTextContent(
        'Standard rate card',
      )
    })
  })

  describe('GIVEN the card does not exist', () => {
    it('THEN redirects the same way', async () => {
      await renderPage([notFoundQueryMock])

      await expectNotFoundRedirect()
    })
  })
})
