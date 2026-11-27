import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, render, RenderResult, screen, waitFor } from '@testing-library/react'

import { OPEN_ACTION_BUTTON_TEST_ID } from '~/components/designSystem/Table/Table'
import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import { CENTRALIZED_DIALOG_NAME } from '~/components/dialogs/const'
import {
  ContractAlertTypeEnum,
  ContractStatusEnum,
  CurrencyEnum,
  GetContractAlertsForAlertsSectionDocument,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  CONTRACT_ALERTS_ADD_ALERT_TEST_ID,
  CONTRACT_ALERTS_DELETE_ACTION_TEST_ID,
  CONTRACT_ALERTS_EDIT_ACTION_TEST_ID,
  CONTRACT_ALERTS_PREMIUM_GATE_TEST_ID,
  CONTRACT_ALERTS_SECTION_TEST_ID,
  ContractAlertsSection,
  isContractAlertsReadOnly,
} from '../ContractAlertsSection'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

const mockHasPermissions = jest.fn()
const mockOpenDeleteAlertDialog = jest.fn()
const mockOpenContractAlertDrawer = jest.fn()
let mockIsPremium = true

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/components/alerts/DeleteAlertDialog', () => ({
  useDeleteAlertDialog: () => ({ openDeleteAlertDialog: mockOpenDeleteAlertDialog }),
}))

jest.mock('~/components/contracts/drawers/contractAlert/useContractAlertDrawer', () => ({
  useContractAlertDrawer: () => ({ openDrawer: mockOpenContractAlertDrawer }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const drawerFields = {
  alertType: ContractAlertTypeEnum.UsageUnits,
  scope: [],
  thresholds: [],
}

const alertsFixture = [
  { id: 'alert-a', name: 'Alert A', code: 'alert_a', __typename: 'ContractAlert', ...drawerFields },
  { id: 'alert-b', name: null, code: 'alert_b', __typename: 'ContractAlert', ...drawerFields },
]

const buildListMock = (
  collection: typeof alertsFixture,
  page = 1,
  onRequest?: jest.Mock,
): TestMocksType[number] => ({
  request: {
    query: GetContractAlertsForAlertsSectionDocument,
    variables: { contractId: 'contract-1', page, limit: 20 },
  },
  result: () => {
    onRequest?.()

    return {
      data: {
        contractAlerts: {
          __typename: 'ContractAlertCollection',
          collection,
          metadata: {
            __typename: 'CollectionMetadata',
            currentPage: page,
            totalPages: 1,
            totalCount: collection.length,
          },
        },
      },
    }
  },
})

const renderSection = (
  mocks: TestMocksType,
  {
    isReadOnly = false,
    currency = CurrencyEnum.Eur,
  }: { isReadOnly?: boolean; currency?: CurrencyEnum | null } = {},
): RenderResult =>
  render(
    <AllTheProviders forceTypenames mocks={mocks}>
      <NiceModal.Provider>
        <ContractAlertsSection
          contractId="contract-1"
          currency={currency ?? undefined}
          isReadOnly={isReadOnly}
        />
      </NiceModal.Provider>
    </AllTheProviders>,
  )

describe('ContractAlertsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremium = true
    mockHasPermissions.mockReturnValue(true)
  })

  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN a non-premium user', () => {
    describe('WHEN the section renders', () => {
      it('THEN should show the premium gate, hide add alert and skip the list query', async () => {
        mockIsPremium = false
        const onRequest = jest.fn()

        renderSection([buildListMock(alertsFixture, 1, onRequest)])

        expect(screen.getByTestId(CONTRACT_ALERTS_SECTION_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(CONTRACT_ALERTS_PREMIUM_GATE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CONTRACT_ALERTS_ADD_ALERT_TEST_ID)).not.toBeInTheDocument()

        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(onRequest).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a premium user with contractsUpdate', () => {
    describe('WHEN the list resolves with two alerts', () => {
      it('THEN should render name and code, with a dash for a missing name', async () => {
        renderSection([buildListMock(alertsFixture)])

        await waitFor(() => expect(screen.getByText('Alert A')).toBeInTheDocument())
        expect(screen.getByText('alert_a')).toBeInTheDocument()
        expect(screen.getByText('-')).toBeInTheDocument()
        expect(screen.getByText('alert_b')).toBeInTheDocument()
        expect(screen.getByTestId(CONTRACT_ALERTS_ADD_ALERT_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CONTRACT_ALERTS_PREMIUM_GATE_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)).toHaveLength(2)
      })
    })

    describe('WHEN the row menu is opened on an editable contract', () => {
      it('THEN should offer edit and delete', async () => {
        renderSection([buildListMock(alertsFixture)])
        await waitFor(() => expect(screen.getByText('Alert A')).toBeInTheDocument())

        fireEvent.click(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)[0])

        expect(screen.getByTestId(CONTRACT_ALERTS_EDIT_ACTION_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(CONTRACT_ALERTS_DELETE_ACTION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN add alert is clicked', () => {
      it('THEN should open the create drawer with the contract and its currency', async () => {
        renderSection([buildListMock(alertsFixture)])
        await waitFor(() => expect(screen.getByText('Alert A')).toBeInTheDocument())

        fireEvent.click(screen.getByTestId(CONTRACT_ALERTS_ADD_ALERT_TEST_ID))

        expect(mockOpenContractAlertDrawer).toHaveBeenCalledWith({
          contractId: 'contract-1',
          currency: CurrencyEnum.Eur,
        })
      })
    })

    describe('WHEN edit is clicked on a row', () => {
      it('THEN should open the edit drawer with that alert', async () => {
        renderSection([buildListMock(alertsFixture)])
        await waitFor(() => expect(screen.getByText('Alert A')).toBeInTheDocument())

        fireEvent.click(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)[0])
        fireEvent.click(screen.getByTestId(CONTRACT_ALERTS_EDIT_ACTION_TEST_ID))

        expect(mockOpenContractAlertDrawer).toHaveBeenCalledWith({
          contractId: 'contract-1',
          currency: CurrencyEnum.Eur,
          alert: expect.objectContaining({ id: 'alert-a' }),
        })
      })
    })

    describe('WHEN the contract currency is not loaded yet', () => {
      it('THEN should disable add alert and hide edit', async () => {
        renderSection([buildListMock(alertsFixture)], { currency: null })
        await waitFor(() => expect(screen.getByText('Alert A')).toBeInTheDocument())

        expect(screen.getByTestId(CONTRACT_ALERTS_ADD_ALERT_TEST_ID)).toBeDisabled()

        fireEvent.click(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)[0])

        expect(screen.queryByTestId(CONTRACT_ALERTS_EDIT_ACTION_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN delete is clicked on a row', () => {
      it('THEN should open the contract delete dialog for that alert', async () => {
        renderSection([buildListMock(alertsFixture)])
        await waitFor(() => expect(screen.getByText('Alert A')).toBeInTheDocument())

        fireEvent.click(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)[0])
        fireEvent.click(screen.getByTestId(CONTRACT_ALERTS_DELETE_ACTION_TEST_ID))

        expect(mockOpenDeleteAlertDialog).toHaveBeenCalledWith({
          alertKind: 'contract',
          id: 'alert-a',
        })
      })
    })

    describe('WHEN the contract is read-only', () => {
      it('THEN should hide add alert and edit, keeping delete', async () => {
        renderSection([buildListMock(alertsFixture)], { isReadOnly: true })
        await waitFor(() => expect(screen.getByText('Alert A')).toBeInTheDocument())

        expect(screen.queryByTestId(CONTRACT_ALERTS_ADD_ALERT_TEST_ID)).not.toBeInTheDocument()

        fireEvent.click(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)[0])

        expect(screen.queryByTestId(CONTRACT_ALERTS_EDIT_ACTION_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(CONTRACT_ALERTS_DELETE_ACTION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the URL carries page 2', () => {
      it('THEN should query page 2 with the default limit', async () => {
        const onRequest = jest.fn()

        window.history.pushState({}, '', '/?page=2')
        renderSection([buildListMock(alertsFixture, 2, onRequest)])

        await waitFor(() => expect(onRequest).toHaveBeenCalled())
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })

    describe('WHEN the list is empty', () => {
      it('THEN should render the empty state', async () => {
        renderSection([buildListMock([])])

        await waitFor(() =>
          expect(screen.getByText('text_1795702994442lrhuqa6ghhj')).toBeInTheDocument(),
        )
        expect(screen.getByText('text_17957029944424sxnh050euf')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a premium user without contractsUpdate', () => {
    describe('WHEN the list resolves', () => {
      it('THEN should hide add alert and every row action', async () => {
        mockHasPermissions.mockReturnValue(false)

        renderSection([buildListMock(alertsFixture)])
        await waitFor(() => expect(screen.getByText('Alert A')).toBeInTheDocument())

        expect(screen.queryByTestId(CONTRACT_ALERTS_ADD_ALERT_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)).toHaveLength(0)
      })
    })
  })
})

describe('isContractAlertsReadOnly', () => {
  it.each([
    [undefined, true],
    [ContractStatusEnum.Terminated, true],
    [ContractStatusEnum.Canceled, true],
    [ContractStatusEnum.Draft, false],
    [ContractStatusEnum.Pending, false],
    [ContractStatusEnum.Active, false],
  ])('THEN should return the read-only flag for status %s', (status, expected) => {
    expect(isContractAlertsReadOnly(status)).toBe(expected)
  })
})
