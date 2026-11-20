import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '../components/button'
import { Field, FieldContent, FieldDescription, FieldLabel } from '../components/field'
import { IconButton } from '../components/icon-button'
import { Input } from '../components/input'

export const AddableExample = ({
  disabled = false,
  readOnly = false,
}: {
  disabled?: boolean
  readOnly?: boolean
}) => {
  const id = useId()
  const [present, setPresent] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const focusPending = useRef(false)

  useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    if (present) inputRef.current?.focus()
    else addRef.current?.focus()
  }, [present])

  return (
    <Field data-disabled={disabled || undefined}>
      <FieldContent>
        <FieldLabel htmlFor={present ? id : undefined}>Customer reference</FieldLabel>
        <FieldDescription id={`${id}-description`}>
          Add an optional reference. Removing it clears its value.
        </FieldDescription>
      </FieldContent>
      {present ? (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            id={id}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            aria-describedby={`${id}-description`}
            placeholder="Enter a reference"
          />
          {!readOnly && (
            <IconButton
              variant="secondary"
              disabled={disabled}
              label="Delete"
              onClick={() => {
                setValue('')
                focusPending.current = true
                setPresent(false)
              }}
            >
              <Trash2 aria-hidden="true" />
            </IconButton>
          )}
        </div>
      ) : (
        <Button
          ref={addRef}
          variant="secondary"
          className="self-start"
          disabled={disabled || readOnly}
          onClick={() => {
            setValue('')
            focusPending.current = true
            setPresent(true)
          }}
        >
          <Plus aria-hidden="true" />
          Add value
        </Button>
      )}
    </Field>
  )
}
