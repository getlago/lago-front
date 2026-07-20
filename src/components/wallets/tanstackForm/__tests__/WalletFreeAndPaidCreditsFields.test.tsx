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

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
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
}: {
  initialValues?: WalletFreeAndPaidSlice
}) => {
  const form = useAppForm({ defaultValues: initialValues })

  return (
    <WalletFreeAndPaidCreditsFields
      form={form}
      currency={CurrencyEnum.Eur}
      rateAmount="2"
      walletName="My wallet"
    />
  )
}

// The metadata editor lives inside a collapsed Accordion; its chevron toggle
// carries data-test="open-charge". Expand it to reach the metadata rows.
const ACCORDION_TOGGLE_TEST_ID = 'open-charge'

describe('WalletFreeAndPaidCreditsFields', () => {
  describe('GIVEN the component renders', () => {
    describe('WHEN in default state', () => {
      it('THEN should show the invoice switch', () => {
        render(<TestWrapper />)

        expect(screen.getByTestId(WALLET_FREE_PAID_INVOICE_SWITCH_TEST_ID)).toBeInTheDocument()
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
})
