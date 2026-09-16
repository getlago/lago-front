import { AnyFormApi, revalidateLogic } from '@tanstack/react-form'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLFormattedError } from 'graphql'
import { z } from 'zod'

import { LagoApiError } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  applyExistingCodeError,
  applyExistingCodeErrorOrToast,
  EXISTING_CODE_ERROR_MESSAGE,
  EXISTING_CODE_FIELD_ERRORS,
} from '../existingCodeError'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient/reactiveVars/toastVar', () => ({
  ...jest.requireActual('~/core/apolloClient/reactiveVars/toastVar'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

// Identity translate so the surfaced error renders as its message key and can be
// asserted through the exported constant (never a raw translation literal).
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const CODE_REQUIRED_MESSAGE = 'text-code-required'

let formRef: AnyFormApi | null = null

// Mirrors how the entity forms are wired: the zod schema sits on the form's
// `onDynamic` slot, the code field declares no validator of its own.
const CodeFormHarness = () => {
  const form = useAppForm({
    defaultValues: { code: '' },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: z.object({ code: z.string().min(1, { message: CODE_REQUIRED_MESSAGE }) }),
    },
    onSubmit: async () => {},
  })

  formRef = form

  return (
    <form.AppForm>
      <form.AppField name="code">{(field) => <field.TextInputField label="code" />}</form.AppField>
      <form.SubmitButton>submit</form.SubmitButton>
    </form.AppForm>
  )
}

const getForm = (): AnyFormApi => formRef as AnyFormApi

describe('applyExistingCodeError', () => {
  afterEach(() => {
    formRef = null
    jest.clearAllMocks()
  })

  describe('GIVEN a submitted form the backend rejected for a duplicate code', () => {
    const submitThenReject = async (): Promise<HTMLElement> => {
      const user = userEvent.setup()

      await act(() => render(<CodeFormHarness />))

      const codeInput = screen.getByRole('textbox')

      await user.type(codeInput, 'taken')
      await act(async () => {
        await getForm().handleSubmit()
      })

      act(() => applyExistingCodeError(getForm()))

      return codeInput
    }

    it('THEN surfaces the shared message under the code input', async () => {
      await submitThenReject()

      expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
    })

    it('THEN blocks submit while the rejected code is untouched', async () => {
      await submitThenReject()

      expect(getForm().state.canSubmit).toBe(false)
    })

    describe('WHEN the user edits the code', () => {
      // Guards the stuck-submit bug: an error written with `setFieldMeta` reads
      // as field-owned, no validation pass ever drops it, and the form can never
      // be submitted again.
      it('THEN drops the error and re-enables submit', async () => {
        const user = userEvent.setup()
        const codeInput = await submitThenReject()

        await user.type(codeInput, '_2')

        expect(screen.queryByText(EXISTING_CODE_ERROR_MESSAGE)).not.toBeInTheDocument()
        expect(getForm().state.canSubmit).toBe(true)
      })
    })

    describe('WHEN the user clears the code', () => {
      it('THEN the schema error replaces the duplicate-code one', async () => {
        const user = userEvent.setup()
        const codeInput = await submitThenReject()

        await user.clear(codeInput)

        expect(await screen.findByText(CODE_REQUIRED_MESSAGE)).toBeInTheDocument()
        expect(screen.queryByText(EXISTING_CODE_ERROR_MESSAGE)).not.toBeInTheDocument()
      })
    })
  })
})

describe('EXISTING_CODE_FIELD_ERRORS', () => {
  it('keys the message under the code field for scrollToFirstInputError', () => {
    expect(EXISTING_CODE_FIELD_ERRORS).toEqual({
      code: { message: EXISTING_CODE_ERROR_MESSAGE, path: ['code'] },
    })
  })
})

describe('applyExistingCodeErrorOrToast', () => {
  afterEach(() => {
    formRef = null
    jest.clearAllMocks()
  })

  const rejectedUnder = (key: string): readonly GraphQLFormattedError[] =>
    [
      { extensions: { details: { [key]: [LagoApiError.ValueAlreadyExist] } } },
    ] as unknown as readonly GraphQLFormattedError[]

  const submitThenRoute = async (errors?: readonly GraphQLFormattedError[]): Promise<boolean> => {
    const user = userEvent.setup()

    await act(() => render(<CodeFormHarness />))

    await user.type(screen.getByRole('textbox'), 'taken')
    await act(async () => {
      await getForm().handleSubmit()
    })

    let applied = false

    act(() => {
      applied = applyExistingCodeErrorOrToast(getForm(), errors)
    })

    return applied
  }

  describe('GIVEN the backend reports the collision under the code key', () => {
    it('THEN surfaces the shared message under the code input', async () => {
      await submitThenRoute(rejectedUnder('code'))

      expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
    })

    it('THEN raises no toast and reports the code input as flagged', async () => {
      const applied = await submitThenRoute(rejectedUnder('code'))

      expect(applied).toBe(true)
      expect(mockAddToast).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the backend reports the collision under another unique field', () => {
    it('THEN leaves the code input clean', async () => {
      await submitThenRoute(rejectedUnder('externalId'))

      expect(screen.queryByText(EXISTING_CODE_ERROR_MESSAGE)).not.toBeInTheDocument()
    })

    it('THEN raises the generic error toast instead of dropping the rejection', async () => {
      const applied = await submitThenRoute(rejectedUnder('externalId'))

      expect(applied).toBe(false)
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
    })
  })

  describe('GIVEN a rejection that is not a duplicate value', () => {
    it.each([
      ['no errors at all', undefined],
      [
        'another error code',
        [
          { extensions: { details: { code: [LagoApiError.UnprocessableEntity] } } },
        ] as unknown as readonly GraphQLFormattedError[],
      ],
    ])('THEN leaves the form and the toasts untouched for %s', async (_, errors) => {
      const applied = await submitThenRoute(errors)

      expect(applied).toBe(false)
      expect(screen.queryByText(EXISTING_CODE_ERROR_MESSAGE)).not.toBeInTheDocument()
      expect(mockAddToast).not.toHaveBeenCalled()
    })
  })
})
