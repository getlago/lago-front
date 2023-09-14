import { act, cleanup, screen } from '@testing-library/react'
import { useFormik } from 'formik'
import { object } from 'yup'

import { chargeSchema } from '~/formValidation/chargeSchema'
import { render } from '~/test-utils'

import { addOnFeeMock, feesMock, invoiceMock } from './fixtures'

import { CreditNoteFormCalculation } from '../CreditNoteFormCalculation'
import { CreditNoteForm } from '../types'

async function prepare() {
  const CreditNoteFormCalculationMock = () => {
    const formikProps = useFormik<Partial<CreditNoteForm>>({
      initialValues: {
        description: undefined,
        reason: undefined,
        fees: feesMock,
        addOnFee: addOnFeeMock,
        payBack: [{ type: undefined, value: undefined }],
        creditAmount: undefined,
        refundAmount: undefined,
      },
      validationSchema: object().shape({
        charges: chargeSchema,
      }),
      enableReinitialize: true,
      validateOnMount: true,
      onSubmit: () => {},
    })

    return <CreditNoteFormCalculation invoice={invoiceMock} formikProps={formikProps} />
  }

  await act(() => {
    render(<CreditNoteFormCalculationMock />)
  })
}
describe('CreditNoteFormCalculation', () => {
  afterEach(cleanup)

  it('renders with correct values', async () => {
    await prepare()

    expect(screen.queryByTestId('prorated-coupon-amount')).toHaveTextContent('-€482.23')
    expect(screen.queryByTestId('total-excluded-tax')).toHaveTextContent('€30,017.77')
    expect(screen.queryByTestId('tax-10-amount')).toHaveTextContent('€1,033.12')
    expect(screen.queryByTestId('tax-20-amount')).toHaveTextContent('€3,837.31')
    expect(screen.queryByTestId('total-tax-included')).toHaveTextContent('€34,888.20')
  })
})
