import { revalidateLogic } from '@tanstack/react-form'
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
import { walletFormValidationSchema } from '~/pages/wallet/formInitialization/validationSchema'
import { mapFromApiToForm } from '~/pages/wallet/mappers/mapFromApiToForm'
import { TWalletDataForm } from '~/pages/wallet/types'
import { render } from '~/test-utils'

// Identity translate keeps the assertions independent of the translation
// files: what matters is that the rendered error is a translated label and
// never zod's own untranslated default.
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {},
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

const SUBMIT_TEST_ID = 'settings-section-test-submit'

// zod v4 replaces a message-less issue (`message: ''`) with this default and
// the inputs render it verbatim — the string a user must never see.
const ZOD_DEFAULT_MESSAGE = 'Invalid input'

/**
 * Same wiring as CreateWallet (schema on `onDynamic` + revalidateLogic) plus a
 * bare submit trigger, so the schema issues actually reach the inputs.
 */
const ValidationWrapper = ({
  overrides = {},
  showBounds = false,
}: {
  overrides?: Partial<TWalletDataForm>
  showBounds?: boolean
}) => {
  const form = useAppForm({
    defaultValues: {
      ...mapFromApiToForm({
        wallet: undefined,
        customerData,
        currency: CurrencyEnum.Usd,
      }),
      ...overrides,
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: walletFormValidationSchema },
    onSubmit: () => {},
  })

  const [showExpirationDate, setShowExpirationDate] = useState(false)
  const [showMinTopUp, setShowMinTopUp] = useState(showBounds)
  const [showMaxTopUp, setShowMaxTopUp] = useState(showBounds)

  return (
    <>
      <SettingsSection
        form={form}
        formType={FORM_TYPE_ENUM.creation}
        customerData={customerData}
        showExpirationDate={showExpirationDate}
        setShowExpirationDate={setShowExpirationDate}
        showMinTopUp={showMinTopUp}
        setShowMinTopUp={setShowMinTopUp}
        showMaxTopUp={showMaxTopUp}
        setShowMaxTopUp={setShowMaxTopUp}
      />
      <button data-test={SUBMIT_TEST_ID} onClick={() => form.handleSubmit()} type="button">
        submit
      </button>
    </>
  )
}

const errorTexts = () => screen.queryAllByTestId('text-field-error').map((node) => node.textContent)

describe('SettingsSection', () => {
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

      it('THEN should display the currency picker when the customer has a currency', () => {
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

  describe('GIVEN the wallet validation schema is wired to the section', () => {
    describe('WHEN submitting with an empty code', () => {
      it('THEN should render an error under the code input', async () => {
        const user = userEvent.setup()

        render(<ValidationWrapper overrides={{ code: '' }} />)

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(errorTexts()).toHaveLength(1)
        })
      })

      it('THEN should render a translated message, never the zod default', async () => {
        const user = userEvent.setup()

        render(<ValidationWrapper overrides={{ code: '' }} />)

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(errorTexts()).toHaveLength(1)
        })
        expect(errorTexts()).not.toContain(ZOD_DEFAULT_MESSAGE)
      })
    })

    describe('WHEN submitting a valid form', () => {
      it('THEN should render no error at all', async () => {
        const user = userEvent.setup()

        render(<ValidationWrapper overrides={{ code: 'wallet-code' }} />)

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(SUBMIT_TEST_ID)).toBeInTheDocument()
        })
        expect(errorTexts()).toHaveLength(0)
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

    describe('WHEN submitting with the min bound above the max bound', () => {
      it('THEN should render an error under both bound inputs', async () => {
        const user = userEvent.setup()

        render(
          <ValidationWrapper
            showBounds
            overrides={{
              code: 'wallet-code',
              paidTopUpMinAmountCents: '100',
              paidTopUpMaxAmountCents: '50',
            }}
          />,
        )

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(errorTexts()).toHaveLength(2)
        })
      })

      it('THEN should render the errorOverride labels, never the zod default', async () => {
        const user = userEvent.setup()

        render(
          <ValidationWrapper
            showBounds
            overrides={{
              code: 'wallet-code',
              paidTopUpMinAmountCents: '100',
              paidTopUpMaxAmountCents: '50',
            }}
          />,
        )

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(errorTexts()).toHaveLength(2)
        })
        expect(errorTexts()).not.toContain(ZOD_DEFAULT_MESSAGE)
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
