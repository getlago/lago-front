import NiceModal from '@ebay/nice-modal-react'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
} from '~/components/dialogs/const'
import { addToast } from '~/core/apolloClient'
import { ContractStatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useTerminateContractDialog } from '../useTerminateContractDialog'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

const mockTerminateContract = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useTerminateContractMutation: () => [mockTerminateContract],
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const NiceModalWrapper = ({ children }: { children: ReactNode }) => (
  <NiceModal.Provider>{children}</NiceModal.Provider>
)

const TestWrapper = ({ status }: { status: ContractStatusEnum }) => {
  const { openTerminateContractDialog } = useTerminateContractDialog()

  return (
    <button
      data-test="open-contract-lifecycle-dialog"
      onClick={() =>
        openTerminateContractDialog({
          externalId: 'external-contract-1',
          status,
        })
      }
    >
      Open dialog
    </button>
  )
}

const renderDialog = async (status: ContractStatusEnum) => {
  const user = userEvent.setup()

  render(
    <NiceModalWrapper>
      <TestWrapper status={status} />
    </NiceModalWrapper>,
  )

  await user.click(screen.getByTestId('open-contract-lifecycle-dialog'))

  return user
}

describe('TerminateContractDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTerminateContract.mockResolvedValue({
      data: {
        terminateContract: {
          id: 'contract-1',
          status: ContractStatusEnum.Terminated,
        },
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it.each([
    [ContractStatusEnum.Active, 'text_1789971751136dxn6qmh7ef9'],
    [ContractStatusEnum.Pending, 'text_1789971751136xsgqxsasdpd'],
  ])('renders a danger confirmation for a %s contract', async (status, title) => {
    await renderDialog(status)

    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toHaveClass(
      'button-danger',
    )
  })

  it('submits through the real dialog and closes after success', async () => {
    const user = await renderDialog(ContractStatusEnum.Pending)

    await user.click(await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))

    await waitFor(() => {
      expect(mockTerminateContract).toHaveBeenCalledWith({
        variables: { input: { externalId: 'external-contract-1' } },
      })
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        translateKey: 'text_1789971751137982utge606b',
      })
      expect(
        screen.queryByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })

  it('keeps the dialog open when the mutation fails', async () => {
    mockTerminateContract.mockRejectedValue(new Error('API error'))
    const user = await renderDialog(ContractStatusEnum.Active)

    await user.click(await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))

    await waitFor(() => {
      expect(mockTerminateContract).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeVisible()
    })
    expect(addToast).not.toHaveBeenCalled()
  })
})
