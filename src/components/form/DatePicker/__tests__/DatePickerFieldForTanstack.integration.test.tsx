import { AnyFormApi, revalidateLogic } from '@tanstack/react-form'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from 'luxon'
import { z } from 'zod'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const SUBMIT_BUTTON_TEST_ID = 'date-picker-field-submit-button'
const REMOVE_DATE_BUTTON_TEST_ID = 'date-picker-field-remove-date-button'
const SET_DATE_BUTTON_TEST_ID = 'date-picker-field-set-date-button'
const RESET_BUTTON_TEST_ID = 'date-picker-field-reset-button'

// Feb 30 keeps every section in range, so the picker builds an invalid DateTime and
// withholds it, where an out-of-range section would be rejected while typing.
const UNPARSEABLE_TYPED_DATE = '02/30/2026'
const PROGRAMMATIC_DATE = '2026-06-15T00:00:00.000Z'
const REFERENCE_REQUIRED = 'reference-required'
const DATE_REQUIRED = 'date-required'

const buildSchema = (required: { reference?: boolean; date?: boolean } = {}) =>
  z.object({
    reference: z
      .string()
      .refine((value) => !required.reference || !!value, { message: REFERENCE_REQUIRED }),
    date: z
      .string()
      .nullable()
      .optional()
      .refine((value) => !required.date || !!value, { message: DATE_REQUIRED }),
  })

type FormValues = z.infer<ReturnType<typeof buildSchema>>

type TestFormProps = {
  onSubmit: (values: FormValues) => void
  onSubmitInvalid?: (props: { formApi: AnyFormApi }) => void
  schema?: ReturnType<typeof buildSchema>
  initialDate?: string
}

const TestForm = ({
  onSubmit,
  onSubmitInvalid,
  schema = buildSchema(),
  initialDate = '',
}: TestFormProps): JSX.Element => {
  const form = useAppForm({
    defaultValues: { reference: '', date: initialDate } as FormValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => onSubmit(value),
    onSubmitInvalid,
  })

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit}>
      <form.AppField name="reference">{(field) => <field.TextInputField />}</form.AppField>

      <form.AppField name="date">
        {(field) => {
          if (field.state.value === null) return null

          return (
            <>
              <field.DatePickerField defaultZone="UTC" />
              <button
                type="button"
                data-test={REMOVE_DATE_BUTTON_TEST_ID}
                onClick={() => field.handleChange(null)}
              />
            </>
          )
        }}
      </form.AppField>

      <button
        type="button"
        data-test={SET_DATE_BUTTON_TEST_ID}
        onClick={() => form.setFieldValue('date', PROGRAMMATIC_DATE)}
      />
      <button type="button" data-test={RESET_BUTTON_TEST_ID} onClick={() => form.reset()} />

      <form.AppForm>
        <form.SubmitButton dataTest={SUBMIT_BUTTON_TEST_ID}>submit</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}

const getReferenceInput = (): HTMLInputElement =>
  document.querySelector('input[name="reference"]') as HTMLInputElement

const getDateInput = (): HTMLInputElement =>
  document.querySelector('input[name="date"]') as HTMLInputElement

const setup = (
  props: Omit<TestFormProps, 'onSubmit'> = {},
): { onSubmit: jest.Mock; user: ReturnType<typeof userEvent.setup> } => {
  const onSubmit = jest.fn()
  const user = userEvent.setup({ pointerEventsCheck: 0 })

  render(<TestForm onSubmit={onSubmit} {...props} />)

  return { onSubmit, user }
}

describe('DatePickerFieldForTanstack in a form', () => {
  const originalDefaultZone = Settings.defaultZone

  beforeAll(() => {
    Settings.defaultZone = 'UTC'
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
  })

  describe('GIVEN a date that does not exist is typed into the picker', () => {
    describe('WHEN another field has been edited', () => {
      it('THEN should disable submit before any submit attempt', async () => {
        const { user } = setup()

        await user.type(getReferenceInput(), 'ref')
        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)

        expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN it replaces a valid date and the form is submitted', () => {
      it('THEN should not submit the last valid value the input no longer shows', async () => {
        const { onSubmit, user } = setup({ initialDate: '2026-02-15T00:00:00.000Z' })

        await user.click(getDateInput())
        await user.keyboard('{ArrowRight}30')

        expect(getDateInput()).toHaveValue(UNPARSEABLE_TYPED_DATE)

        fireEvent.submit(getDateInput().closest('form') as HTMLFormElement)

        await waitFor(() => {
          expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
        })
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    // form-core skips validation on a submit it refuses, which hid every other error and
    // left `onSubmitInvalid` nothing to scroll to.
    describe('WHEN the form is submitted with another invalid field', () => {
      it('THEN should validate the whole form on that attempt', async () => {
        const onSubmitInvalid = jest.fn(
          ({ formApi }: { formApi: AnyFormApi }) => formApi.state.errorMap.onDynamic,
        )
        const { onSubmit, user } = setup({
          schema: buildSchema({ reference: true }),
          onSubmitInvalid,
        })

        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)
        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmitInvalid).toHaveBeenCalledTimes(1)
        })
        expect(onSubmitInvalid.mock.results[0].value).toHaveProperty('reference')
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the field already shows a schema error', () => {
      it('THEN should show only the invalid-date message', async () => {
        const { user } = setup({ schema: buildSchema({ date: true }) })

        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        expect(await screen.findByText(DATE_REQUIRED, { exact: false })).toBeInTheDocument()

        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)

        expect(screen.queryByText(DATE_REQUIRED, { exact: false })).not.toBeInTheDocument()
      })
    })

    describe('WHEN the input is cleared and a valid date is typed', () => {
      it('THEN should submit the typed date', async () => {
        const { onSubmit, user } = setup()

        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)
        await user.clear(getDateInput())
        await user.type(getDateInput(), '12/25/2026')
        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith({
            reference: '',
            date: '2026-12-25T00:00:00.000Z',
          })
        })
      })
    })

    // The field stays mounted when only its picker is swapped out: a picker error left behind
    // would keep submit disabled with nothing on screen.
    describe('WHEN the picker is removed from the field', () => {
      it('THEN should submit without the date', async () => {
        const { onSubmit, user } = setup()

        await user.type(getReferenceInput(), 'ref')
        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)

        expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled()

        await user.click(screen.getByTestId(REMOVE_DATE_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith({ reference: 'ref', date: null })
        })
      })
    })

    // A picker error left behind would show under a valid date and keep submit disabled.
    describe('WHEN the date is set programmatically', () => {
      it('THEN should submit the new date', async () => {
        const { onSubmit, user } = setup()

        await user.type(getReferenceInput(), 'ref')
        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)

        expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled()

        await user.click(screen.getByTestId(SET_DATE_BUTTON_TEST_ID))

        expect(getDateInput()).toHaveValue('06/15/2026')

        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith({ reference: 'ref', date: PROGRAMMATIC_DATE })
        })
      })
    })

    // A reset leaving the date value unchanged gives the picker no new value to re-sync from:
    // the typed text would survive with nothing flagging it, and submit the stale value.
    describe('WHEN the form is reset', () => {
      it('THEN should show and submit the reset value', async () => {
        const { onSubmit, user } = setup()

        await user.type(getReferenceInput(), 'ref')
        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)
        await user.click(screen.getByTestId(RESET_BUTTON_TEST_ID))

        expect(getDateInput()).toHaveValue('')

        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith({ reference: '', date: '' })
        })
      })
    })
  })
})
