import { MockedResponse } from '@apollo/client/testing'
import { act, screen, waitFor } from '@testing-library/react'

import { GetCatalogPlansForContractDrawerDocument } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  CONTRACT_ATTACHED_OBJECT_DRAWER_CUSTOMER_TEST_ID,
  CONTRACT_ATTACHED_OBJECT_DRAWER_PLAN_COMBOBOX_TEST_ID,
  ContractAttachedObjectFormValues,
} from '../constants'
import { ContractAttachedObjectDrawerContent } from '../ContractAttachedObjectDrawerContent'

const mockBillingEntityPicker = jest.fn()

jest.mock('~/components/billingEntity/BillingEntityFormPicker', () => ({
  BillingEntityFormPicker: (props: Record<string, unknown>) => {
    mockBillingEntityPicker(props)
    return <div data-test="billing-entity-picker" />
  },
}))

const plansMock: MockedResponse = {
  request: {
    query: GetCatalogPlansForContractDrawerDocument,
    variables: { limit: 50 },
  },
  result: {
    data: { catalogPlans: { collection: [] } },
  },
}

const getInputByTestId = (testId: string): HTMLInputElement | null => {
  const element = screen.getByTestId(testId)

  if (element instanceof HTMLInputElement) return element

  return element.querySelector('input')
}

const defaultValues: ContractAttachedObjectFormValues = {
  externalCustomerId: 'customer-external-id',
  billingEntityId: 'billing-entity-1',
  planCode: 'enterprise',
  isPlanRequired: true,
}

const Wrapper = ({ planLocked }: { planLocked: boolean }) => {
  const form = useAppForm({ defaultValues })

  return (
    <ContractAttachedObjectDrawerContent
      form={form}
      fieldLocks={{ planCode: planLocked }}
      seededCustomer={{ externalId: 'customer-external-id', displayName: 'Acme' }}
      seededPlan={{ code: 'enterprise', name: 'Enterprise plan' }}
    />
  )
}

describe('ContractAttachedObjectDrawerContent', () => {
  beforeEach(() => jest.clearAllMocks())

  it('always shows the customer as a locked, non-editable field', () => {
    render(<Wrapper planLocked={false} />, { mocks: [plansMock] })

    expect(getInputByTestId(CONTRACT_ATTACHED_OBJECT_DRAWER_CUSTOMER_TEST_ID)).toHaveValue('Acme')
    expect(getInputByTestId(CONTRACT_ATTACHED_OBJECT_DRAWER_CUSTOMER_TEST_ID)).toBeDisabled()
  })

  it('keeps the plan editable when unlocked', async () => {
    render(<Wrapper planLocked={false} />, { mocks: [plansMock] })

    await waitFor(() =>
      expect(getInputByTestId(CONTRACT_ATTACHED_OBJECT_DRAWER_PLAN_COMBOBOX_TEST_ID)).toHaveValue(
        'Enterprise plan',
      ),
    )
    expect(getInputByTestId(CONTRACT_ATTACHED_OBJECT_DRAWER_PLAN_COMBOBOX_TEST_ID)).toBeEnabled()
  })

  it('locks the plan and skips its option fetch when locked', async () => {
    const plansResult = jest.fn(() => ({ data: { catalogPlans: { collection: [] } } }))

    render(<Wrapper planLocked />, { mocks: [{ ...plansMock, result: plansResult }] })

    expect(getInputByTestId(CONTRACT_ATTACHED_OBJECT_DRAWER_PLAN_COMBOBOX_TEST_ID)).toHaveValue(
      'Enterprise plan',
    )
    expect(getInputByTestId(CONTRACT_ATTACHED_OBJECT_DRAWER_PLAN_COMBOBOX_TEST_ID)).toBeDisabled()
    await act(async () => undefined)
    expect(plansResult).not.toHaveBeenCalled()
  })

  it('passes the billing entity value through to the shared picker', () => {
    render(<Wrapper planLocked={false} />, { mocks: [plansMock] })

    expect(mockBillingEntityPicker).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'billing-entity-1' }),
    )
  })
})
