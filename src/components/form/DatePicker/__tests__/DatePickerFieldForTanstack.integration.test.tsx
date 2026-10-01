import { AnyFormApi, revalidateLogic } from '@tanstack/react-form'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from 'luxon'
import { z } from 'zod'

import { INVALID_DATE_VALUE } from '~/core/constants/form'
import { endOfDayIso } from '~/core/utils/dateUtils'
import { addUnsupportedDateIssue } from '~/formValidation/zodCustoms'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const SUBMIT_BUTTON_TEST_ID = 'date-picker-field-submit-button'
const REMOVE_DATE_BUTTON_TEST_ID = 'date-picker-field-remove-date-button'
const SET_DATE_BUTTON_TEST_ID = 'date-picker-field-set-date-button'
const RESET_BUTTON_TEST_ID = 'date-picker-field-reset-button'

// Feb 30 keeps every section in range, so the picker builds an invalid DateTime, where an
// out-of-range section would be rejected while typing.
const UNPARSEABLE_TYPED_DATE = '02/30/2026'
const PROGRAMMATIC_DATE = '2026-06-15T00:00:00.000Z'
const REFERENCE_REQUIRED = 'reference-required'

const buildSchema = (requireReference = false) =>
  z
    .object({
      reference: z
        .string()
        .refine((value) => !requireReference || !!value, { message: REFERENCE_REQUIRED }),
      date: z.string().nullable().optional(),
    })
    .superRefine((data, ctx) => {
      addUnsupportedDateIssue(ctx, data.date, ['date'])
    })

type FormValues = z.infer<ReturnType<typeof buildSchema>>

type SubmitInvalidProps = { value: FormValues; formApi: AnyFormApi }

type TestFormProps = {
  onSubmit: (values: FormValues) => void
  onSubmitInvalid?: (props: SubmitInvalidProps) => void
  schema?: ReturnType<typeof buildSchema>
  initialDate?: string
  transformValue?: (value: string | undefined) => string | undefined
}

const TestForm = ({
  onSubmit,
  onSubmitInvalid,
  schema = buildSchema(),
  initialDate = '',
  transformValue,
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
              <field.DatePickerField defaultZone="UTC" transformValue={transformValue} />
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

// Snapshots what `onSubmitInvalid` sees at call time: the scroll-to-error helpers read it there.
const captureSubmitInvalid = (): jest.Mock =>
  jest.fn(({ value, formApi }: SubmitInvalidProps) => ({
    date: value.date,
    errorPaths: Object.keys(formApi.state.errorMap.onDynamic ?? {}),
  }))

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
    describe('WHEN nothing has been submitted yet', () => {
      it('THEN should keep the typed text and leave submit enabled', async () => {
        const { user } = setup()

        await user.type(getReferenceInput(), 'ref')
        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)

        expect(getDateInput()).toHaveValue(UNPARSEABLE_TYPED_DATE)
        expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeEnabled()
      })
    })

    describe('WHEN the form is submitted with another invalid field', () => {
      it('THEN should report both fields and submit nothing', async () => {
        const onSubmitInvalid = captureSubmitInvalid()
        const { onSubmit, user } = setup({ schema: buildSchema(true), onSubmitInvalid })

        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)
        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmitInvalid).toHaveBeenCalledTimes(1)
        })
        expect(onSubmitInvalid.mock.results[0].value).toEqual({
          date: INVALID_DATE_VALUE,
          errorPaths: expect.arrayContaining(['reference', 'date']),
        })
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    // The picker withholds a date that does not exist from `onChange`, so without the
    // placeholder the form would still hold, and submit, the last valid date.
    describe('WHEN it replaces a valid date and the form is submitted', () => {
      it('THEN should not submit the last valid value the input no longer shows', async () => {
        const onSubmitInvalid = captureSubmitInvalid()
        const { onSubmit, user } = setup({
          initialDate: '2026-02-15T00:00:00.000Z',
          onSubmitInvalid,
        })

        await user.click(getDateInput())
        await user.keyboard('{ArrowRight}30')

        expect(getDateInput()).toHaveValue(UNPARSEABLE_TYPED_DATE)

        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmitInvalid).toHaveBeenCalledTimes(1)
        })
        expect(onSubmit).not.toHaveBeenCalled()
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

    describe('WHEN the picker is removed from the field', () => {
      it('THEN should submit without the date', async () => {
        const { onSubmit, user } = setup()

        await user.type(getReferenceInput(), 'ref')
        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)
        await user.click(screen.getByTestId(REMOVE_DATE_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith({ reference: 'ref', date: null })
        })
      })
    })

    describe('WHEN the date is set programmatically', () => {
      it('THEN should show and submit the new date', async () => {
        const { onSubmit, user } = setup()

        await user.type(getReferenceInput(), 'ref')
        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)
        await user.click(screen.getByTestId(SET_DATE_BUTTON_TEST_ID))

        expect(getDateInput()).toHaveValue('06/15/2026')

        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith({ reference: 'ref', date: PROGRAMMATIC_DATE })
        })
      })
    })

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

  describe('GIVEN a transformValue', () => {
    describe('WHEN a date is typed', () => {
      it('THEN should store the transformed value', async () => {
        const { onSubmit, user } = setup({ transformValue: endOfDayIso })

        await user.type(getDateInput(), '12/25/2026')
        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith({
            reference: '',
            date: '2026-12-25T23:59:59.999Z',
          })
        })
      })
    })

    // Run through `endOfDayIso`, the placeholder would come back as '' and pass the schema.
    describe('WHEN a date that does not exist is typed', () => {
      it('THEN should store the placeholder untransformed', async () => {
        const onSubmitInvalid = captureSubmitInvalid()
        const { onSubmit, user } = setup({ transformValue: endOfDayIso, onSubmitInvalid })

        await user.type(getDateInput(), UNPARSEABLE_TYPED_DATE)
        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onSubmitInvalid).toHaveBeenCalledTimes(1)
        })
        expect(onSubmitInvalid.mock.results[0].value.date).toBe(INVALID_DATE_VALUE)
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })
  })
})
