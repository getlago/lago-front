import { AnyFormApi } from '@tanstack/react-form'
import { act, screen } from '@testing-library/react'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { applyExistingCodeError, EXISTING_CODE_ERROR_MESSAGE } from '../existingCodeError'

// Identity translate so the surfaced error renders as its message key and can be
// asserted through the exported constant (never a raw translation literal).
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

let formRef: AnyFormApi | null = null

// Mounts a single code field so its field meta exists before the helper writes
// to it (mirrors how the entity drawers mount NameAndCodeGroup).
const CodeFieldHarness = () => {
  const form = useAppForm({ defaultValues: { code: '' } })

  formRef = form

  return (
    <form.AppForm>
      <form.AppField name="code">{(field) => <field.TextInputField label="code" />}</form.AppField>
    </form.AppForm>
  )
}

describe('applyExistingCodeError', () => {
  afterEach(() => {
    formRef = null
    jest.clearAllMocks()
  })

  describe('GIVEN a form with a mounted code field', () => {
    describe('WHEN the duplicate-code error is applied', () => {
      it('THEN sets the shared existing-code message on the code onDynamic error map', async () => {
        await act(() => render(<CodeFieldHarness />))

        act(() => applyExistingCodeError(formRef as AnyFormApi))

        expect((formRef as AnyFormApi).getFieldMeta('code')?.errorMap?.onDynamic).toEqual({
          message: EXISTING_CODE_ERROR_MESSAGE,
        })
      })

      it('THEN surfaces the message under the code input', async () => {
        await act(() => render(<CodeFieldHarness />))

        act(() => applyExistingCodeError(formRef as AnyFormApi))

        expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
      })
    })

    describe('WHEN another error-map entry already exists', () => {
      it('THEN preserves it and only adds the onDynamic entry', async () => {
        await act(() => render(<CodeFieldHarness />))

        act(() =>
          (formRef as AnyFormApi).setFieldMeta('code', (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onChange: { message: 'text-required' } },
          })),
        )

        act(() => applyExistingCodeError(formRef as AnyFormApi))

        const errorMap = (formRef as AnyFormApi).getFieldMeta('code')?.errorMap

        expect(errorMap?.onChange).toEqual({ message: 'text-required' })
        expect(errorMap?.onDynamic).toEqual({ message: EXISTING_CODE_ERROR_MESSAGE })
      })
    })
  })
})
