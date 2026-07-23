import { screen } from '@testing-library/react'

import { ALL_ADJUSTMENT_VALUES, ALL_ANCHOR_VALUES } from '~/core/constants/issuingDatePolicy'
import { render } from '~/test-utils'

import {
  EDIT_INVOICE_ISSUING_DATE_POLICY_DIALOG_ADJUSTMENT_COMBOBOX_TEST_CLASSNAME,
  EDIT_INVOICE_ISSUING_DATE_POLICY_DIALOG_ANCHOR_COMBOBOX_TEST_CLASSNAME,
  EditInvoiceIssuingDatePolicyFormContent,
} from '../EditInvoiceIssuingDatePolicyFormContent'

const mockGetIssuingDateInfoForAlert = jest.fn(() => ({
  descriptionCopyAsHtml: '<p>description copy</p>',
  expectedIssuingDateCopy: 'expected issuing date copy',
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('@tanstack/react-form', () => ({
  useStore: (store: { state: unknown }, selector: (state: unknown) => unknown) =>
    selector(store.state),
}))

jest.mock('~/hooks/useIssuingDatePolicy', () => ({
  useIssuingDatePolicy: () => ({
    anchorComboboxData: [],
    adjustmentComboboxData: [],
    getIssuingDateInfoForAlert: mockGetIssuingDateInfoForAlert,
  }),
}))

jest.mock('~/hooks/forms/useAppform', () => ({
  withForm: ({ render: RenderComponent }: { render: React.FC<Record<string, unknown>> }) =>
    RenderComponent,
}))

type FormValues = {
  subscriptionInvoiceIssuingDateAnchor: string
  subscriptionInvoiceIssuingDateAdjustment: string
}

const buildForm = (values: FormValues) => {
  const state = { values }
  const ComboBoxField = (props: { className?: string }) => <div data-test={props.className} />

  return {
    store: { state },
    AppField: ({
      children,
    }: {
      name: string
      children: (field: { ComboBoxField: typeof ComboBoxField }) => JSX.Element
    }) => children({ ComboBoxField }),
  }
}

const renderContent = (values: Partial<FormValues> = {}, gracePeriod?: number | null) =>
  render(
    <EditInvoiceIssuingDatePolicyFormContent
      // @ts-expect-error - mocked form shape
      form={buildForm({
        subscriptionInvoiceIssuingDateAnchor: '',
        subscriptionInvoiceIssuingDateAdjustment: '',
        ...values,
      })}
      gracePeriod={gracePeriod}
    />,
  )

describe('EditInvoiceIssuingDatePolicyFormContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the form content is rendered', () => {
    describe('WHEN in default state', () => {
      it.each([
        ['anchor combobox', EDIT_INVOICE_ISSUING_DATE_POLICY_DIALOG_ANCHOR_COMBOBOX_TEST_CLASSNAME],
        [
          'adjustment combobox',
          EDIT_INVOICE_ISSUING_DATE_POLICY_DIALOG_ADJUSTMENT_COMBOBOX_TEST_CLASSNAME,
        ],
      ])('THEN should display the %s', (_, testId) => {
        renderContent()

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should display the info alert with the computed copy', () => {
        renderContent()

        const alert = screen.getByTestId('alert-type-info')

        expect(alert).toBeInTheDocument()
        expect(alert).toHaveTextContent('expected issuing date copy')
      })
    })
  })

  describe('GIVEN the alert computation', () => {
    describe('WHEN both fields are empty', () => {
      it('THEN should normalize empty values to undefined', () => {
        renderContent({
          subscriptionInvoiceIssuingDateAnchor: '',
          subscriptionInvoiceIssuingDateAdjustment: '',
        })

        expect(mockGetIssuingDateInfoForAlert).toHaveBeenLastCalledWith(
          expect.objectContaining({
            subscriptionInvoiceIssuingDateAnchor: undefined,
            subscriptionInvoiceIssuingDateAdjustment: undefined,
          }),
        )
      })
    })

    describe('WHEN both fields are set', () => {
      it('THEN should pass the selected values through', () => {
        renderContent({
          subscriptionInvoiceIssuingDateAnchor: ALL_ANCHOR_VALUES.CurrentPeriodEnd,
          subscriptionInvoiceIssuingDateAdjustment: ALL_ADJUSTMENT_VALUES.KeepAnchor,
        })

        expect(mockGetIssuingDateInfoForAlert).toHaveBeenLastCalledWith(
          expect.objectContaining({
            subscriptionInvoiceIssuingDateAnchor: ALL_ANCHOR_VALUES.CurrentPeriodEnd,
            subscriptionInvoiceIssuingDateAdjustment: ALL_ADJUSTMENT_VALUES.KeepAnchor,
          }),
        )
      })
    })

    describe('WHEN a grace period is provided', () => {
      it('THEN should forward the grace period', () => {
        renderContent({}, 5)

        expect(mockGetIssuingDateInfoForAlert).toHaveBeenLastCalledWith(
          expect.objectContaining({ gracePeriod: 5 }),
        )
      })
    })

    describe('WHEN the grace period is null or undefined', () => {
      it.each([
        ['null', null],
        ['undefined', undefined],
      ])('THEN should default a %s grace period to 0', (_, gracePeriod) => {
        renderContent({}, gracePeriod)

        expect(mockGetIssuingDateInfoForAlert).toHaveBeenLastCalledWith(
          expect.objectContaining({ gracePeriod: 0 }),
        )
      })
    })
  })
})
