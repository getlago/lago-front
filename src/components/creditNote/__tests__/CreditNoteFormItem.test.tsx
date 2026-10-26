import { render, screen } from '@testing-library/react'

import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  CREDIT_NOTE_DEFAULT_VALUES,
  CreditNoteFormValues,
} from '~/pages/createCreditNote/validationSchema'
import { AllTheProviders } from '~/test-utils'

import { CreditNoteFormItem } from '../CreditNoteFormItem'
import { FromFee } from '../types'

const buildFee = (overrides: Partial<FromFee> = {}): FromFee => ({
  id: 'fee-1',
  checked: true,
  value: 100,
  name: 'Test Fee',
  maxAmount: 10000,
  ...overrides,
})

const Wrapper = ({ fee, isReadOnly }: { fee: FromFee; isReadOnly?: boolean }) => {
  const defaultValues: CreditNoteFormValues = { ...CREDIT_NOTE_DEFAULT_VALUES, creditFee: [fee] }

  const form = useAppForm({ defaultValues })

  return (
    <CreditNoteFormItem
      form={form}
      currency={CurrencyEnum.Usd}
      feeName="Test Fee"
      fieldKey="creditFee[0]"
      maxValue={10000}
      isReadOnly={isReadOnly}
    />
  )
}

const renderComponent = ({
  fee = buildFee(),
  isReadOnly,
}: { fee?: FromFee; isReadOnly?: boolean } = {}) =>
  render(<Wrapper fee={fee} isReadOnly={isReadOnly} />, { wrapper: AllTheProviders })

describe('CreditNoteFormItem', () => {
  describe('isReadOnly prop', () => {
    it('should disable the input when isReadOnly is true', () => {
      renderComponent({ isReadOnly: true })

      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('should enable the input when isReadOnly is false and checkbox is checked', () => {
      renderComponent({ isReadOnly: false })

      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('should enable the input when isReadOnly is undefined and checkbox is checked', () => {
      renderComponent({ isReadOnly: undefined })

      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('should disable the input when checkbox is unchecked regardless of isReadOnly', () => {
      renderComponent({ fee: buildFee({ checked: false }), isReadOnly: false })

      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })
})
