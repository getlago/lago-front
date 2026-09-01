import { screen, waitFor } from '@testing-library/react'
import { useFormik } from 'formik'
import { date, object } from 'yup'

import { MIN_SUPPORTED_DATE, UNSUPPORTED_DATE_ERROR } from '~/core/constants/form'
import { render } from '~/test-utils'

import { DatePickerField } from '../DatePickerField'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => `translated_${key}`,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { id: 'org-1', timezone: 'UTC' },
  }),
}))

const FIELD_NAME = 'createdAt'

// Mirrors CreatePayment, the last yup form holding a date field.
const Harness = ({ createdAt }: { createdAt: string }) => {
  const formikProps = useFormik({
    initialValues: { [FIELD_NAME]: createdAt },
    validateOnMount: true,
    validationSchema: object().shape({
      [FIELD_NAME]: date().required('').min(MIN_SUPPORTED_DATE.toJSDate(), UNSUPPORTED_DATE_ERROR),
    }),
    onSubmit: jest.fn(),
  })

  return (
    <>
      <DatePickerField name={FIELD_NAME} formikProps={formikProps} />
      <span data-test="is-valid">{String(formikProps.isValid)}</span>
    </>
  )
}

describe('DatePickerField', () => {
  describe('GIVEN a date the schema accepts', () => {
    describe('WHEN the field renders', () => {
      it('THEN should keep the form valid and render no error', async () => {
        render(<Harness createdAt="2026-09-02T00:00:00.000Z" />)

        await waitFor(() => {
          expect(screen.getByTestId('is-valid')).toHaveTextContent('true')
        })

        expect(screen.queryByText(`translated_${UNSUPPORTED_DATE_ERROR}`)).not.toBeInTheDocument()
      })
    })
  })

  // Regression (ING-634): the error was gated on Formik's `touched`, which DatePicker never
  // turns true because it drops `onBlur` — so the rejection was invisible and only showed up
  // as a disabled submit button.
  describe('GIVEN a date the schema rejects', () => {
    describe('WHEN the field renders', () => {
      it('THEN should render the translated schema error', async () => {
        render(<Harness createdAt="0026-08-31T00:00:00.000Z" />)

        expect(await screen.findByText(`translated_${UNSUPPORTED_DATE_ERROR}`)).toBeInTheDocument()
      })

      it('THEN should keep the form invalid', async () => {
        render(<Harness createdAt="0026-08-31T00:00:00.000Z" />)

        await waitFor(() => {
          expect(screen.getByTestId('is-valid')).toHaveTextContent('false')
        })
      })
    })
  })
})
