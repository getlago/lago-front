import { type ReactElement, useId, useState } from 'react'

import { Button } from '../components/button'
import { Checkbox } from '../components/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../components/field'
import { RadioGroup, RadioGroupItem } from '../components/radio-group'

const states = ['Default', 'Invalid', 'Disabled', 'Read-only']

export function CheckboxFields(): ReactElement {
  const id = useId()

  return (
    <FieldGroup>
      {states.map((state) => (
        <FieldGroup key={state}>
          <p className="v2-text-caption text-text-muted">{state}</p>
          {[false, true].map((description) => {
            const fieldId = `${id}-${state}-${description}`
            const label = (
              <FieldLabel htmlFor={fieldId}>Send finalized invoices by email</FieldLabel>
            )
            const renderContent = (): ReactElement => {
              if (!description) return label
              return (
                <FieldContent>
                  {label}
                  <FieldDescription id={`${fieldId}-description`}>
                    Notify the customer when an invoice is ready.
                  </FieldDescription>
                </FieldContent>
              )
            }
            const describedBy =
              [description && `${fieldId}-description`, state === 'Invalid' && `${fieldId}-error`]
                .filter(Boolean)
                .join(' ') || undefined

            return (
              <Field key={fieldId} orientation="horizontal">
                <Checkbox
                  id={fieldId}
                  defaultChecked
                  disabled={state === 'Disabled'}
                  readOnly={state === 'Read-only'}
                  aria-invalid={state === 'Invalid' || undefined}
                  aria-describedby={describedBy}
                />
                {renderContent()}
                {state === 'Invalid' && (
                  <FieldError id={`${fieldId}-error`}>Please review this option.</FieldError>
                )}
              </Field>
            )
          })}
        </FieldGroup>
      ))}
    </FieldGroup>
  )
}

const notifications = [
  {
    value: 'invoices',
    label: 'Finalized invoices',
    description: 'Send an email when an invoice is ready.',
  },
  {
    value: 'receipts',
    label: 'Payment receipts',
    description: 'Send a receipt after a successful payment.',
  },
  {
    value: 'reminders',
    label: 'Payment reminders',
    description: 'Remind customers about unpaid invoices.',
  },
]

export function CheckboxGroupFields(): ReactElement {
  const id = useId()

  return (
    <FieldGroup>
      {['Basic', 'Description', 'Invalid', 'Disabled'].map((state) => (
        <FieldSet
          key={state}
          disabled={state === 'Disabled'}
          aria-describedby={`${id}-${state}-help${state === 'Invalid' ? ` ${id}-error` : ''}`}
        >
          <FieldLegend>Email notifications · {state}</FieldLegend>
          <FieldDescription id={`${id}-${state}-help`}>
            Choose which updates the customer receives.
          </FieldDescription>
          <FieldGroup spacing="compact">
            {notifications.map((option) => {
              const fieldId = `${id}-${state}-${option.value}`
              const label = <FieldLabel htmlFor={fieldId}>{option.label}</FieldLabel>
              const renderContent = (): ReactElement => {
                if (state === 'Basic') return label
                return (
                  <FieldContent>
                    {label}
                    <FieldDescription id={`${fieldId}-help`}>{option.description}</FieldDescription>
                  </FieldContent>
                )
              }

              return (
                <Field key={option.value} orientation="horizontal">
                  <Checkbox
                    id={fieldId}
                    disabled={state === 'Disabled'}
                    aria-describedby={state === 'Basic' ? undefined : `${fieldId}-help`}
                  />
                  {renderContent()}
                </Field>
              )
            })}
          </FieldGroup>
          {state === 'Invalid' && (
            <FieldError id={`${id}-error`}>Choose at least one notification.</FieldError>
          )}
        </FieldSet>
      ))}
    </FieldGroup>
  )
}

export function SelectAllCheckboxes(): ReactElement {
  const id = useId()
  const [selected, setSelected] = useState(['invoices'])

  return (
    <FieldSet>
      <FieldLegend>Invoice notifications</FieldLegend>
      <FieldGroup spacing="compact">
        <Field orientation="horizontal">
          <Checkbox
            id={`${id}-all`}
            checked={selected.length === notifications.length}
            indeterminate={selected.length > 0 && selected.length < notifications.length}
            onCheckedChange={(checked) =>
              setSelected(checked ? notifications.map((option) => option.value) : [])
            }
          />
          <FieldLabel htmlFor={`${id}-all`}>Select all</FieldLabel>
        </Field>
        {notifications.map((option) => (
          <Field key={option.value} orientation="horizontal">
            <Checkbox
              id={`${id}-${option.value}`}
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) =>
                setSelected((current) =>
                  checked
                    ? [...current, option.value]
                    : current.filter((value) => value !== option.value),
                )
              }
            />
            <FieldLabel htmlFor={`${id}-${option.value}`}>{option.label}</FieldLabel>
          </Field>
        ))}
      </FieldGroup>
    </FieldSet>
  )
}

const collectionMethods = [
  {
    value: 'automatic',
    label: 'Automatic collection',
    description: 'Charge the saved payment method.',
  },
  {
    value: 'link',
    label: 'Payment link',
    description: 'Let the customer pay using a secure link.',
  },
  {
    value: 'manual',
    label: 'Manual collection',
    description: 'Record a payment collected outside Lago.',
  },
]

export function RadioFields(): ReactElement {
  const id = useId()

  return (
    <FieldGroup>
      {['Basic', ...states, 'One disabled option'].map((state) => {
        const groupId = `${id}-${state.replaceAll(' ', '-')}`

        return (
          <FieldSet key={state} disabled={state === 'Disabled'}>
            <FieldLegend id={`${groupId}-label`}>Payment collection · {state}</FieldLegend>
            <FieldDescription id={`${groupId}-help`}>
              Choose how to collect invoice payments.
            </FieldDescription>
            <RadioGroup
              defaultValue="automatic"
              disabled={state === 'Disabled'}
              readOnly={state === 'Read-only'}
              aria-labelledby={`${groupId}-label`}
              aria-describedby={`${groupId}-help${state === 'Invalid' ? ` ${groupId}-error` : ''}`}
            >
              {collectionMethods.map((option) => {
                const fieldId = `${groupId}-${option.value}`
                const label = <FieldLabel htmlFor={fieldId}>{option.label}</FieldLabel>
                const renderContent = (): ReactElement => {
                  if (state === 'Basic') return label
                  return (
                    <FieldContent>
                      {label}
                      <FieldDescription id={`${fieldId}-help`}>
                        {option.description}
                      </FieldDescription>
                    </FieldContent>
                  )
                }

                return (
                  <Field key={option.value} orientation="horizontal">
                    <RadioGroupItem
                      id={fieldId}
                      value={option.value}
                      disabled={state === 'One disabled option' && option.value === 'link'}
                      aria-invalid={state === 'Invalid' || undefined}
                      aria-describedby={state === 'Basic' ? undefined : `${fieldId}-help`}
                    />
                    {renderContent()}
                  </Field>
                )
              })}
            </RadioGroup>
            {state === 'Invalid' && (
              <FieldError id={`${groupId}-error`}>
                Choose an available collection method.
              </FieldError>
            )}
          </FieldSet>
        )
      })}
    </FieldGroup>
  )
}

export function verifyChoiceLayout(canvas: HTMLElement): void {
  for (const indicator of canvas.querySelectorAll<HTMLElement>('.v2-radio-indicator')) {
    const style = getComputedStyle(indicator)

    if (style.width !== '8px' || style.height !== '8px' || style.backgroundColor !== style.color)
      throw new Error('Selected radio must render an 8px dot using the indicator color')
  }

  for (const field of canvas.querySelectorAll<HTMLElement>('[data-orientation="horizontal"]')) {
    const control = field.querySelector<HTMLElement>('.v2-choice-control')
    const content = field.querySelector<HTMLElement>(
      '[data-slot="field-content"], [data-slot="field-label"]',
    )

    if (!control || !content) throw new Error('Choice Field must have a control and content')
    const controlBounds = control.getBoundingClientRect()
    const contentBounds = content.getBoundingClientRect()

    if (
      Math.abs(controlBounds.width - 16) > 0.5 ||
      Math.abs(contentBounds.left - controlBounds.right - 8) > 0.5
    ) {
      throw new Error('Choice control size or Field gap differs from Figma')
    }
    if (Math.abs(controlBounds.top - contentBounds.top - 2) > 0.5)
      throw new Error('Control must align to the first label line')
    const description = content.querySelector<HTMLElement>('[data-slot="field-description"]')
    const label = content.querySelector<HTMLElement>('[data-slot="field-label"]')

    if (
      description &&
      label &&
      Math.abs(description.getBoundingClientRect().top - label.getBoundingClientRect().bottom - 4) >
        0.5
    )
      throw new Error('FieldContent must have a 4px gap')
    const error = field.querySelector<HTMLElement>('[data-slot="field-error"]')

    if (error) {
      const errorBounds = error.getBoundingClientRect()

      if (
        Math.abs(errorBounds.top - contentBounds.bottom - 4) > 0.5 ||
        Math.abs(errorBounds.left - field.getBoundingClientRect().left) > 0.5
      )
        throw new Error('Error must span the Field with a 4px gap')
    }
  }
}

export function ChoiceFormReset(): ReactElement {
  const id = useId()

  return (
    <form>
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox id={`${id}-email`} name="email" defaultChecked />
          <FieldLabel htmlFor={`${id}-email`}>Email notifications</FieldLabel>
        </Field>
        <FieldSet>
          <FieldLegend id={`${id}-legend`}>Payment collection</FieldLegend>
          <RadioGroup name="collection" defaultValue="automatic" aria-labelledby={`${id}-legend`}>
            {collectionMethods.map((option) => (
              <Field key={option.value} orientation="horizontal">
                <RadioGroupItem id={`${id}-${option.value}`} value={option.value} />
                <FieldLabel htmlFor={`${id}-${option.value}`}>{option.label}</FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </FieldSet>
        <Button type="reset">Reset choices</Button>
      </FieldGroup>
    </form>
  )
}
