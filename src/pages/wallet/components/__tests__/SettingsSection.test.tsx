import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import {
  ADD_MAX_TOPUP_OPTION_DATA_TEST,
  ADD_MIN_MAX_AMOUNT_DATA_TEST,
  ADD_MIN_TOPUP_OPTION_DATA_TEST,
  SHOW_EXPIRATION_AT_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { CurrencyEnum, GetCustomerInfosForWalletFormQuery } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { SettingsSection } from '~/pages/wallet/components/SettingsSection'
import { mapFromApiToForm } from '~/pages/wallet/mappers/mapFromApiToForm'
import { render } from '~/test-utils'

const mockHasFeatureFlag = jest.fn<boolean, [string]>(() => false)

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {},
    hasFeatureFlag: mockHasFeatureFlag,
  }),
}))

// The billing-entity picker owns its own queries and tests — stub it here.
jest.mock('~/components/billingEntity/BillingEntityFormPicker', () => ({
  BillingEntityFormPicker: () => <div data-test="billing-entity-form-picker-stub" />,
}))

const customerData = {
  customer: {
    id: 'customer-id',
    externalId: 'ext-1',
    currency: CurrencyEnum.Usd,
    timezone: null,
    billingEntity: { id: 'be-1' },
  },
} as unknown as GetCustomerInfosForWalletFormQuery

const TestWrapper = ({
  formType = FORM_TYPE_ENUM.creation,
  withCustomerCurrency = true,
}: {
  formType?: keyof typeof FORM_TYPE_ENUM
  withCustomerCurrency?: boolean
}) => {
  const data = withCustomerCurrency
    ? customerData
    : ({
        customer: { ...customerData.customer, currency: null },
      } as unknown as GetCustomerInfosForWalletFormQuery)

  const form = useAppForm({
    defaultValues: mapFromApiToForm({
      wallet: undefined,
      customerData: data,
      currency: CurrencyEnum.Usd,
    }),
  })

  const [showExpirationDate, setShowExpirationDate] = useState(false)
  const [showMinTopUp, setShowMinTopUp] = useState(false)
  const [showMaxTopUp, setShowMaxTopUp] = useState(false)

  return (
    <SettingsSection
      form={form}
      formType={formType}
      customerData={data}
      showExpirationDate={showExpirationDate}
      setShowExpirationDate={setShowExpirationDate}
      showMinTopUp={showMinTopUp}
      setShowMinTopUp={setShowMinTopUp}
      showMaxTopUp={showMaxTopUp}
      setShowMaxTopUp={setShowMaxTopUp}
    />
  )
}

const queryInput = (container: HTMLElement, name: string) =>
  container.querySelector(`input[name="${name}"]`) as HTMLInputElement

describe('SettingsSection', () => {
  beforeEach(() => {
    mockHasFeatureFlag.mockReset()
    mockHasFeatureFlag.mockReturnValue(false)
  })

  describe('GIVEN the creation mode', () => {
    describe('WHEN the section renders', () => {
      it.each([['name'], ['rateAmount'], ['priority']])(
        'THEN should display the %s input',
        (name) => {
          const { container } = render(<TestWrapper />)

          expect(queryInput(container, name)).toBeInTheDocument()
        },
      )

      it('THEN should enable the rateAmount input', () => {
        const { container } = render(<TestWrapper />)

        expect(queryInput(container, 'rateAmount')).not.toBeDisabled()
      })

      it('THEN should hide the currency picker when the customer has a currency and no multi-currency flag', () => {
        const { container } = render(<TestWrapper />)

        expect(queryInput(container, 'currency')).not.toBeInTheDocument()
      })

      it('THEN should display the currency picker when the multi-currency flag is on', () => {
        mockHasFeatureFlag.mockReturnValue(true)

        const { container } = render(<TestWrapper />)

        expect(queryInput(container, 'currency')).toBeInTheDocument()
      })

      it('THEN should display the currency picker when the customer has no currency', () => {
        const { container } = render(<TestWrapper withCustomerCurrency={false} />)

        expect(queryInput(container, 'currency')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the edition mode', () => {
    describe('WHEN the section renders', () => {
      it('THEN should disable the rateAmount input', () => {
        const { container } = render(<TestWrapper formType={FORM_TYPE_ENUM.edition} />)

        expect(queryInput(container, 'rateAmount')).toBeDisabled()
      })

      it('THEN should disable the currency picker', () => {
        mockHasFeatureFlag.mockReturnValue(true)

        const { container } = render(<TestWrapper formType={FORM_TYPE_ENUM.edition} />)

        expect(queryInput(container, 'currency')).toBeDisabled()
      })
    })
  })

  describe('GIVEN the expiration date toggle', () => {
    describe('WHEN clicking the add expiration button', () => {
      it('THEN should display the expiration date picker', async () => {
        const user = userEvent.setup()
        const { container } = render(<TestWrapper />)

        expect(queryInput(container, 'expirationAt')).not.toBeInTheDocument()

        await user.click(screen.getByTestId(SHOW_EXPIRATION_AT_DATA_TEST))

        await waitFor(() => {
          expect(queryInput(container, 'expirationAt')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the min/max top-up popper', () => {
    describe('WHEN adding the minimum amount', () => {
      it('THEN should display the min amount input', async () => {
        const user = userEvent.setup()
        const { container } = render(<TestWrapper />)

        expect(queryInput(container, 'paidTopUpMinAmountCents')).not.toBeInTheDocument()

        await user.click(screen.getByTestId(ADD_MIN_MAX_AMOUNT_DATA_TEST))
        await user.click(await screen.findByTestId(ADD_MIN_TOPUP_OPTION_DATA_TEST))

        await waitFor(() => {
          expect(queryInput(container, 'paidTopUpMinAmountCents')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN adding both amounts', () => {
      it('THEN should disable the popper opener', async () => {
        const user = userEvent.setup()
        const { container } = render(<TestWrapper />)

        await user.click(screen.getByTestId(ADD_MIN_MAX_AMOUNT_DATA_TEST))
        await user.click(await screen.findByTestId(ADD_MIN_TOPUP_OPTION_DATA_TEST))
        await user.click(screen.getByTestId(ADD_MIN_MAX_AMOUNT_DATA_TEST))
        await user.click(await screen.findByTestId(ADD_MAX_TOPUP_OPTION_DATA_TEST))

        await waitFor(() => {
          expect(queryInput(container, 'paidTopUpMaxAmountCents')).toBeInTheDocument()
        })
        expect(screen.getByTestId(ADD_MIN_MAX_AMOUNT_DATA_TEST)).toBeDisabled()
      })
    })
  })
})
