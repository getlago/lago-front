import { revalidateLogic } from '@tanstack/react-form'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  buildCreditNoteSchema,
  CREDIT_NOTE_DEFAULT_VALUES,
  CreditNoteFormValues,
} from '~/pages/createCreditNote/validationSchema'
import { AllTheProviders } from '~/test-utils'

import {
  CreditNoteMetadataSection,
  META_DATA_BUTTON_DATA_TEST_ID,
} from '../CreditNoteMetadataSection'

const SUBMIT_TEST_ID = 'metadata-test-submit'

const Wrapper = ({ metadata = [] }: { metadata?: CreditNoteFormValues['metadata'] }) => {
  const form = useAppForm({
    defaultValues: { ...CREDIT_NOTE_DEFAULT_VALUES, metadata },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: buildCreditNoteSchema({
        currency: CurrencyEnum.Usd,
        feesPerInvoice: undefined,
        feeForAddOn: undefined,
        feeForCredit: undefined,
        isPrepaidCreditsInvoice: true,
        getAllocationLimits: () => ({
          totalTaxIncluded: 0,
          maxCreditableAmount: 0,
          maxRefundableAmount: 0,
          maxOffsettableAmount: 0,
        }),
      }),
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <CreditNoteMetadataSection form={form} />
      <button type="submit" data-test={SUBMIT_TEST_ID}>
        submit
      </button>
    </form>
  )
}

const renderComponent = (props: { metadata?: CreditNoteFormValues['metadata'] } = {}) =>
  render(<Wrapper {...props} />, { wrapper: AllTheProviders })

describe('CreditNoteMetadataSection', () => {
  describe('GIVEN no metadata', () => {
    describe('WHEN the section renders', () => {
      it('THEN should render no row', () => {
        renderComponent()

        expect(screen.queryAllByRole('textbox')).toHaveLength(0)
      })
    })

    describe('WHEN the add button is clicked', () => {
      it('THEN should append an empty row', async () => {
        const user = userEvent.setup()

        renderComponent()

        await user.click(screen.getByTestId(META_DATA_BUTTON_DATA_TEST_ID))

        expect(screen.getAllByRole('textbox')).toHaveLength(2)
      })
    })
  })

  describe('GIVEN an existing row', () => {
    describe('WHEN its trash button is clicked', () => {
      it('THEN should remove it', async () => {
        const user = userEvent.setup()

        renderComponent({ metadata: [{ key: 'a', value: '1' }] })

        const addButton = screen.getByTestId(META_DATA_BUTTON_DATA_TEST_ID)
        const trashButton = screen
          .getAllByRole('button')
          .find((button) => button !== addButton && button.getAttribute('type') !== 'submit')

        await user.click(trashButton as HTMLElement)

        expect(screen.queryAllByRole('textbox')).toHaveLength(0)
      })
    })
  })

  describe('GIVEN a duplicated key', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should show the uniqueness message', async () => {
        const user = userEvent.setup()

        renderComponent({
          metadata: [
            { key: 'same', value: '1' },
            { key: 'same', value: '2' },
          ],
        })

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        expect(
          await screen.findAllByText(
            'Keys should be unique; please differentiate them to move forward.',
          ),
        ).toHaveLength(2)
      })
    })
  })

  describe('GIVEN an empty key', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should show the required message', async () => {
        const user = userEvent.setup()

        renderComponent({ metadata: [{ key: '', value: '1' }] })

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        expect(await screen.findByText('Metadata key is required')).toBeInTheDocument()
      })
    })
  })
})
