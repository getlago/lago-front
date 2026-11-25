import * as React from 'react'

import { Button } from '../components/button'
import {
  Combobox,
  ComboboxAdd,
  ComboboxChip,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxFreeText,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from '../components/combobox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldHelp,
  FieldLabel,
} from '../components/field'
import { SearchInput } from '../components/input'

export type ComboboxFieldKind =
  'single' | 'inside' | 'above' | 'free-inside' | 'free-above' | 'popup'
const options = ['Alex Morgan', 'Sam Rivera', 'Taylor Anderson']

function ComboboxFieldExample({
  kind,
  state,
}: {
  kind: ComboboxFieldKind
  state: string
}): React.ReactElement {
  const id = React.useId()
  const freeText = kind.startsWith('free-')
  const multiple = kind !== 'single' && kind !== 'popup'
  const above = kind === 'above' || kind === 'free-above'
  const readOnly = state === 'Read-only'
  const disabled = state === 'Disabled'
  const [values, setValues] = React.useState<string[]>(
    state === 'Empty' ? [] : [freeText ? 'Priority' : options[0]],
  )
  const [query, setQuery] = React.useState('')
  const [error, setError] = React.useState<string | null>(
    state === 'Invalid' ? 'Review this value.' : null,
  )
  const describedBy = `${id}-help${error ? ` ${id}-error` : ''}`
  const input = (
    <ComboboxInput
      id={id}
      placeholder={freeText ? 'Add a value' : 'Select an owner'}
      aria-invalid={!!error || undefined}
      aria-describedby={describedBy}
    />
  )
  const chips = (
    <ComboboxChips>
      {values.map((value) => (
        <ComboboxChip key={value} label={value} removeLabel={`Remove ${value}`} />
      ))}
      {!above && !readOnly && input}
    </ComboboxChips>
  )
  let control: React.ReactNode

  if (multiple && readOnly)
    control = (
      <div role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy}>
        {chips}
      </div>
    )
  else if (kind === 'popup')
    control = (
      <ComboboxTrigger
        id={id}
        aria-describedby={describedBy}
        aria-invalid={!!error || undefined}
        render={<Button variant="secondary" />}
      >
        <ComboboxValue>{(value: string | null) => value || 'Assign owner'}</ComboboxValue>
      </ComboboxTrigger>
    )
  else if (multiple)
    control = (
      <div className="flex flex-col gap-2">
        {above && chips}
        <ComboboxControl>
          {above ? input : chips}
          {!freeText && <ComboboxTrigger aria-label="Show owners" />}
        </ComboboxControl>
      </div>
    )
  else
    control = (
      <ComboboxControl>
        {input}
        <ComboboxClear label="Clear owner" />
        <ComboboxTrigger aria-label="Show owners" />
      </ComboboxControl>
    )
  const field = (
    <Field>
      <FieldContent>
        <div className="flex items-center gap-1">
          <FieldLabel id={`${id}-label`} htmlFor={multiple && readOnly ? undefined : id}>
            {freeText ? 'Values' : 'Quote owner'} · {state}
          </FieldLabel>
          <FieldHelp label="About this field">
            {freeText
              ? 'Add a string, email address or other value.'
              : 'Choose who is responsible for this quote.'}
          </FieldHelp>
        </div>
        <FieldDescription id={`${id}-help`}>
          {freeText
            ? 'Type a value and choose Add or press Enter.'
            : 'Select an owner from the available team members.'}
        </FieldDescription>
      </FieldContent>
      {control}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  )

  if (freeText)
    return (
      <ComboboxFreeText
        value={values}
        onValueChange={setValues}
        inputValue={query}
        onInputValueChange={setQuery}
        disabled={disabled}
        readOnly={readOnly}
        createItem={(value) => value}
        getItemKey={(value) => value}
        addLabel={(value) => `Add ${value}`}
        validate={(candidate, selected) =>
          selected.includes(candidate) ? 'This value is already added.' : null
        }
        onValidationChange={setError}
      >
        {field}
        {!!query.trim() && !values.includes(query.trim()) && !error && (
          <ComboboxContent>
            <ComboboxAdd />
          </ComboboxContent>
        )}
      </ComboboxFreeText>
    )
  const content = (
    <ComboboxContent>
      {kind === 'popup' && (
        <ComboboxInput
          render={<SearchInput />}
          aria-label="Search owners"
          placeholder="Search owners"
        />
      )}
      {kind === 'popup' && <ComboboxSeparator />}
      <ComboboxEmpty>No owners found</ComboboxEmpty>
      <ComboboxList getItemKey={(value: string) => value}>
        {(value) => <ComboboxItem value={value}>{value}</ComboboxItem>}
      </ComboboxList>
    </ComboboxContent>
  )

  if (multiple)
    return (
      <Combobox
        multiple
        items={options}
        value={values}
        onValueChange={setValues}
        disabled={disabled}
        readOnly={readOnly}
      >
        {field}
        {content}
      </Combobox>
    )
  return (
    <Combobox
      items={options}
      defaultValue={state === 'Empty' ? null : options[0]}
      disabled={disabled}
      readOnly={readOnly}
    >
      {field}
      {content}
    </Combobox>
  )
}

export function ComboboxFieldStates({ kind }: { kind: ComboboxFieldKind }): React.ReactElement {
  return (
    <div className="max-w-md space-y-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => (
        <ComboboxFieldExample key={state} kind={kind} state={state} />
      ))}
    </div>
  )
}
