import { useId, useState } from 'react'

import { Button } from '../components/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldHelp,
  FieldLabel,
} from '../components/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../components/select'

export const periods = [
  { value: 'month', label: 'Monthly', description: 'Bill every month' },
  { value: 'quarter', label: 'Quarterly', description: 'Bill every three months' },
  { value: 'year', label: 'Yearly', description: 'Bill once a year' },
  { value: 'once', label: 'One-time', description: 'Bill once' },
  { value: 'custom', label: 'Custom', description: 'Custom schedule', disabled: true },
]

export function SelectExample({
  state = 'Filled',
  withField = false,
  grouped = false,
  descriptions = false,
}: {
  state?: string
  withField?: boolean
  grouped?: boolean
  descriptions?: boolean
}): JSX.Element {
  const id = useId()
  const [value, setValue] = useState<string | null>(state === 'Empty' ? null : 'month')
  const invalid = state.startsWith('Invalid')
  const error =
    invalid && state !== 'Invalid without message' ? 'Choose a billing period.' : undefined
  const control = (
    <Select
      items={periods}
      value={value}
      onValueChange={setValue}
      disabled={state === 'Disabled'}
      readOnly={state === 'Read-only'}
    >
      <SelectTrigger
        id={id}
        aria-label={withField ? undefined : `Billing period · ${state}`}
        aria-invalid={invalid || undefined}
        aria-describedby={withField ? `${id}-description${error ? ` ${id}-error` : ''}` : undefined}
      >
        <SelectValue placeholder="Select a billing period" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {grouped && <SelectLabel>Recurring</SelectLabel>}
          {periods.slice(0, 3).map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              label={item.label}
              description={descriptions ? item.description : undefined}
            />
          ))}
        </SelectGroup>
        {grouped && <SelectSeparator />}
        <SelectGroup>
          {grouped && <SelectLabel>Other</SelectLabel>}
          {periods.slice(grouped ? 3 : 4).map((item) => (
            <SelectItem
              key={item.value}
              {...item}
              description={descriptions ? item.description : undefined}
            />
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )

  if (!withField) return control
  return (
    <Field data-disabled={state === 'Disabled' || undefined}>
      <FieldContent>
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor={id}>Billing period · {state}</FieldLabel>
          <FieldHelp label="About billing period">The interval between invoices.</FieldHelp>
        </div>
        <FieldDescription id={`${id}-description`}>
          Choose how often this plan is billed.
        </FieldDescription>
      </FieldContent>
      {control}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  )
}

export function SelectStates({ withField = false }: { withField?: boolean }): JSX.Element {
  return (
    <div className="w-[320px] max-w-full space-y-6">
      {[
        'Empty',
        'Filled',
        'Hover',
        'Focus',
        'Disabled',
        'Read-only',
        'Invalid',
        'Invalid + Hover',
        'Invalid + Focus',
        'Invalid without message',
      ].map((state) => (
        <div key={state} className="space-y-2">
          {!withField && <div className="v2-text-caption text-text-muted">{state}</div>}
          <SelectExample state={state} withField={withField} />
        </div>
      ))}
      <div className="v2-text-caption text-text-muted">
        Hover or keyboard-focus the editable controls to inspect their interaction states.
      </div>
    </div>
  )
}

export function SelectResetExample(): JSX.Element {
  const [value, setValue] = useState<number | null>(0)
  const items = [
    { value: 0, label: 'Off' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '60 seconds' },
  ]

  return (
    <div className="max-w-[320px] space-y-4">
      <Select name="interval" items={items} value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Refresh interval">
          <SelectValue placeholder="Choose an interval" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} {...item} />
          ))}
        </SelectContent>
      </Select>
      <output className="v2-text-caption">Stored value: {value ?? '(empty)'}</output>
      <Button onClick={() => setValue(null)}>Reset</Button>
    </div>
  )
}
