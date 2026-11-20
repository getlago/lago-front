import { revalidateLogic } from '@tanstack/react-form'
import { Button } from 'lago-ui/button'
import { ColorTheme } from 'lago-ui/color-theme'
import { FieldGroup } from 'lago-ui/field'
import { IconButton } from 'lago-ui/icon-button'
import { TooltipProvider } from 'lago-ui/tooltip'
import { ReactElement, useRef, useState } from 'react'
import { z } from 'zod'

import { Icon } from '~/components/designSystem/Icon'
import { useAppForm } from '~/hooks/forms/useAppform'

const defaultValues: z.infer<typeof validationSchema> = {
  name: '',
  code: '',
  quantity: '',
  search: '',
  password: '',
  borderless: '',
  note: undefined as string | undefined,
}

const validationSchema = z.object({
  name: z.string().min(1, 'A name is required'),
  code: z.string(),
  quantity: z
    .string()
    .refine((value) => value === '' || /^-?\d+$/.test(value), 'Enter a whole number'),
  search: z.string(),
  password: z.string(),
  borderless: z.string(),
  note: z.string().min(1, 'Enter a note or remove the field').optional(),
})

const displayExampleError = (message: string): string => message

export const InputFieldIntegration = (): ReactElement => {
  const [submitted, setSubmitted] = useState<typeof defaultValues | null>(null)
  const [dark, setDark] = useState(false)
  const noteRef = useRef<HTMLInputElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: validationSchema },
    onSubmit: ({ value }) => setSubmitted(value),
  })

  const addNote = (): void => {
    form.setFieldValue('note', '')
    requestAnimationFrame(() => noteRef.current?.focus())
  }

  const removeNote = (): void => {
    form.setFieldValue('note', undefined)
    form.resetField('note')
    requestAnimationFrame(() => addRef.current?.focus())
  }

  return (
    <ColorTheme mode={dark ? 'dark' : 'light'}>
      <TooltipProvider>
        <section className="h-screen overflow-auto bg-surface p-8 text-text-default">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="v2-text-label text-xl">Input and Field · TanStack integration</h1>
              <p className="v2-text-body text-text-muted">
                Submit to validate, then edit to revalidate. This example sends no requests.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => setDark(!dark)}>
              {dark ? 'Light mode' : 'Dark mode'}
            </Button>
          </div>
          <form
            id="input-field-integration"
            className="max-w-lg"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.InputField
                    label="Name"
                    description="Required; validation starts on submit."
                    placeholder="Customer name"
                    translateError={displayExampleError}
                    help={{ label: 'About the name', content: 'Use a recognizable customer name.' }}
                  />
                )}
              </form.AppField>
              <form.AppField name="code">
                {(field) => (
                  <field.InputField
                    label="Code"
                    description="Spaces become underscores; letters become lowercase."
                    beforeChangeFormatter={['code', 'lowercase']}
                    placeholder="customer_code"
                  />
                )}
              </form.AppField>
              <form.AppField name="quantity">
                {(field) => (
                  <field.InputField
                    label="Quantity"
                    description="Integer formatter; the form stores a string. Try a negative number."
                    inputMode="numeric"
                    beforeChangeFormatter="int"
                    translateError={displayExampleError}
                  />
                )}
              </form.AppField>
              <form.AppField name="search">
                {(field) => (
                  <field.InputField label="Search" type="search" placeholder="Search customers" />
                )}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.InputField label="Password" type="password" autoComplete="new-password" />
                )}
              </form.AppField>
              <form.AppField name="borderless">
                {(field) => (
                  <field.InputField
                    label="Borderless"
                    variant="borderless"
                    placeholder="Enter a value"
                  />
                )}
              </form.AppField>
              <form.Subscribe selector={(state) => state.values.note !== undefined}>
                {(hasNote) => {
                  if (!hasNote) {
                    return (
                      <Button ref={addRef} type="button" variant="outline" onClick={addNote}>
                        Add a note
                      </Button>
                    )
                  }
                  return (
                    <div className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <form.AppField name="note">
                          {(field) => (
                            <field.InputField
                              ref={noteRef}
                              label="Note"
                              translateError={displayExampleError}
                            />
                          )}
                        </form.AppField>
                      </div>
                      <IconButton type="button" label="Delete" onClick={removeNote}>
                        <Icon name="trash" size="small" />
                      </IconButton>
                    </div>
                  )
                }}
              </form.Subscribe>
              <div className="flex gap-2">
                <form.AppForm>
                  <form.SubmitButton>Submit</form.SubmitButton>
                </form.AppForm>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset()
                    setSubmitted(null)
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.setErrorMap({
                      onDynamic: {
                        fields: { name: { message: 'This name is already taken', path: ['name'] } },
                      },
                    })
                  }
                >
                  Simulate server error
                </Button>
              </div>
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <pre
                    aria-label="Form values"
                    className="overflow-auto rounded-lg bg-surface-subtle p-4 text-sm"
                  >
                    {JSON.stringify(values, null, 2)}
                  </pre>
                )}
              </form.Subscribe>
              {submitted && <p role="status">Submitted successfully. No request was sent.</p>}
            </FieldGroup>
          </form>
        </section>
      </TooltipProvider>
    </ColorTheme>
  )
}

export default InputFieldIntegration
