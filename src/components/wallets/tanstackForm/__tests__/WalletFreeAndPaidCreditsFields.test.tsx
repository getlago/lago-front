import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import type { WalletFreeAndPaidSlice } from '../walletFormSchema'
import {
  WALLET_FREE_PAID_INVOICE_SWITCH_TEST_ID,
  WALLET_FREE_PAID_METADATA_ADD_BUTTON_TEST_ID,
  WALLET_FREE_PAID_METADATA_DELETE_BUTTON_TEST_ID,
  WALLET_FREE_PAID_METADATA_ROW_TEST_ID,
  WalletFreeAndPaidCreditsFields,
} from '../WalletFreeAndPaidCreditsFields'

// Real English templates for the three top-up-range keys, so the mock can
// exercise `{{var}}` interpolation the way production `translateKey` does.
const TOPUP_TEMPLATES: Record<string, string> = {
  text_1758285686647a868tiok58q:
    'The credit top-up amount must be between {{minCredits}} credits ({{minAmount}}) and {{maxCredits}} credits ({{maxAmount}}) for this wallet. Please top up within this range.',
  text_1758285686647tnf634qa99c:
    'The credit top-up is below the minimum allowed for this wallet: {{minCredits}} credits ({{minAmount}}).',
  text_175828568664787kip4pzn8l:
    'The credit top-up exceeds the maximum allowed for this wallet: {{maxCredits}} credits ({{maxAmount}}).',
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    // Mirror production behavior: return the template (key falls back to itself),
    // then substitute any `{{var}}` placeholders from the data object.
    translate: (key: string, data?: Record<string, unknown>) => {
      const template = TOPUP_TEMPLATES[key] ?? key

      if (!data) return template

      return Object.entries(data).reduce(
        (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
        template,
      )
    },
  }),
}))

const emptySlice: WalletFreeAndPaidSlice = {
  freeCredits: '',
  paidCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  metadata: [],
}

const TestWrapper = ({
  initialValues = emptySlice,
  min = null,
  max = null,
}: {
  initialValues?: WalletFreeAndPaidSlice
  min?: string | null
  max?: string | null
}) => {
  const form = useAppForm({ defaultValues: initialValues })

  return (
    <WalletFreeAndPaidCreditsFields
      form={form}
      currency={CurrencyEnum.Eur}
      rateAmount="2"
      walletName="My wallet"
      min={min}
      max={max}
    />
  )
}

// The metadata editor lives inside a collapsed Accordion; its chevron toggle
// carries data-test="open-charge". Expand it to reach the metadata rows.
const ACCORDION_TOGGLE_TEST_ID = 'open-charge'

const KEY_FREE_CREDITS_LABEL = 'text_1784552920237ss68mgdwkmt'
const KEY_PAID_CREDITS_LABEL = 'text_1784552920237g89fvc8lki5'
const KEY_WALLET_SETTINGS_DESC = 'text_1784552920236w7zteb5dk1y'
const KEY_METADATA_DESC = 'text_1784552920236qoa5zheiakw'

describe('WalletFreeAndPaidCreditsFields', () => {
  describe('GIVEN the component renders', () => {
    describe('WHEN in default state', () => {
      it('THEN should show the invoice switch', () => {
        render(<TestWrapper />)

        expect(screen.getByTestId(WALLET_FREE_PAID_INVOICE_SWITCH_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the Free credits field before the Paid credits field', () => {
        render(<TestWrapper />)

        const labels = screen.getAllByText(
          (_, el) =>
            el?.textContent === KEY_FREE_CREDITS_LABEL ||
            el?.textContent === KEY_PAID_CREDITS_LABEL,
        )

        // First matched label in DOM order must be the free-credits one.
        expect(labels[0]).toHaveTextContent(KEY_FREE_CREDITS_LABEL)
      })

      it('THEN should render the wallet-settings and metadata description lines', () => {
        render(<TestWrapper />)

        expect(screen.getByText(KEY_WALLET_SETTINGS_DESC)).toBeInTheDocument()
        expect(screen.getByText(KEY_METADATA_DESC)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the metadata accordion is expanded and empty', () => {
    describe('WHEN opening it', () => {
      it('THEN should show the add button and no metadata rows', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(ACCORDION_TOGGLE_TEST_ID))

        expect(screen.getByTestId(WALLET_FREE_PAID_METADATA_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(screen.queryAllByTestId(WALLET_FREE_PAID_METADATA_ROW_TEST_ID)).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the metadata editor', () => {
    describe('WHEN clicking the add button once', () => {
      it('THEN should render one metadata row', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(ACCORDION_TOGGLE_TEST_ID))
        await user.click(screen.getByTestId(WALLET_FREE_PAID_METADATA_ADD_BUTTON_TEST_ID))

        expect(screen.getAllByTestId(WALLET_FREE_PAID_METADATA_ROW_TEST_ID)).toHaveLength(1)
      })
    })

    describe('WHEN clicking the add button twice', () => {
      it('THEN should render two metadata rows', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(ACCORDION_TOGGLE_TEST_ID))

        const addButton = screen.getByTestId(WALLET_FREE_PAID_METADATA_ADD_BUTTON_TEST_ID)

        await user.click(addButton)
        await user.click(addButton)

        expect(screen.getAllByTestId(WALLET_FREE_PAID_METADATA_ROW_TEST_ID)).toHaveLength(2)
      })
    })

    describe('WHEN deleting a metadata row', () => {
      it('THEN should remove that row', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            initialValues={{
              ...emptySlice,
              metadata: [
                { key: 'a', value: '1' },
                { key: 'b', value: '2' },
              ],
            }}
          />,
        )

        await user.click(screen.getByTestId(ACCORDION_TOGGLE_TEST_ID))

        expect(screen.getAllByTestId(WALLET_FREE_PAID_METADATA_ROW_TEST_ID)).toHaveLength(2)

        const [firstDelete] = screen.getAllByTestId(WALLET_FREE_PAID_METADATA_DELETE_BUTTON_TEST_ID)

        await user.click(firstDelete)

        expect(screen.getAllByTestId(WALLET_FREE_PAID_METADATA_ROW_TEST_ID)).toHaveLength(1)
      })
    })
  })

  describe('GIVEN metadata is seeded on mount', () => {
    describe('WHEN the accordion is expanded', () => {
      it('THEN should render one row per seeded entry', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            initialValues={{ ...emptySlice, metadata: [{ key: 'env', value: 'prod' }] }}
          />,
        )

        await user.click(screen.getByTestId(ACCORDION_TOGGLE_TEST_ID))

        expect(screen.getAllByTestId(WALLET_FREE_PAID_METADATA_ROW_TEST_ID)).toHaveLength(1)
      })
    })
  })

  describe('GIVEN top-up min/max limits and an out-of-range paid credits amount', () => {
    describe('WHEN the range error is displayed', () => {
      // rateAmount=2, min=10, max=100 → minCredits=5, maxCredits=50.
      // paidCredits=100 → amount=200 > max → out of range.
      it('THEN interpolates the credit/amount values instead of showing raw placeholders', () => {
        render(
          <TestWrapper initialValues={{ ...emptySlice, paidCredits: '100' }} min="10" max="100" />,
        )

        // The bug: raw "{{minCredits}}" etc. leaked to the UI.
        expect(screen.queryByText(/\{\{/)).not.toBeInTheDocument()
        // The resolved values are present (5 = 10/2 credits, 50 = 100/2 credits).
        expect(
          screen.getByText(/must be between 5 credits .* and 50 credits .* for this wallet/),
        ).toBeInTheDocument()
      })
    })
  })
})
