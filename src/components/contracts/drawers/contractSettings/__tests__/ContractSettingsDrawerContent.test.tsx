import { fireEvent, screen } from '@testing-library/react'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  CONTRACT_SETTINGS_DRAWER_EXTERNAL_ID_TEST_ID,
  CONTRACT_SETTINGS_DRAWER_SHOW_NAME_TEST_ID,
  ContractSettingsFormValues,
} from '../constants'
import { ContractSettingsDrawerContent } from '../ContractSettingsDrawerContent'

jest.mock('~/components/purchaseOrder/PurchaseOrderFormBlock', () => ({
  PurchaseOrderFormBlock: () => <div data-test="purchase-order-form" />,
}))

const getInputByTestId = (testId: string): HTMLInputElement | null => {
  const element = screen.getByTestId(testId)

  if (element instanceof HTMLInputElement) return element

  return element.querySelector('input')
}

const defaultValues: ContractSettingsFormValues = {
  externalId: 'external-contract-1',
  name: '',
  startedAt: '2026-01-01T00:00:00Z',
  endedAt: '2099-12-31T00:00:00Z',
  initialEndedAt: '2099-12-31T00:00:00Z',
  billingAnchorDate: '2026-01-15T00:00:00.000Z',
  purchaseOrderNumber: 'PO-42',
}

const Wrapper = ({ locked }: { locked: boolean }) => {
  const form = useAppForm({ defaultValues })

  return (
    <ContractSettingsDrawerContent
      form={form}
      fieldLocks={{ startedAt: locked, billingAnchorDate: locked }}
    />
  )
}

describe('ContractSettingsDrawerContent', () => {
  it('renders the drawer title and description', async () => {
    render(<Wrapper locked={false} />)

    expect(await screen.findByText('Edit contract settings')).toBeInTheDocument()
    expect(screen.getByText('Define how the contract will function.')).toBeInTheDocument()
  })

  it('always shows the external id as a disabled, display-only field', () => {
    render(<Wrapper locked={false} />)

    expect(getInputByTestId(CONTRACT_SETTINGS_DRAWER_EXTERNAL_ID_TEST_ID)).toBeDisabled()
    expect(getInputByTestId(CONTRACT_SETTINGS_DRAWER_EXTERNAL_ID_TEST_ID)).toHaveValue(
      'external-contract-1',
    )
  })

  it('reveals the optional name field', () => {
    render(<Wrapper locked={false} />)

    fireEvent.click(screen.getByTestId(CONTRACT_SETTINGS_DRAWER_SHOW_NAME_TEST_ID))
    expect(screen.getByPlaceholderText('Type a contract name')).toBeInTheDocument()
  })
})
