import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupInputProps,
  InputGroupText,
} from 'lago-ui/input-group'
import { cn } from 'lago-ui/utils'
import {
  ChangeEvent,
  CompositionEvent,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import './amount-input.css'
import { CurrencyOption, CurrencyPicker } from './CurrencyPicker'

import {
  AmountFormattingOptions,
  definedDefaultPlaceholder,
  defineNewBeforeChangeFormatter,
} from '../AmountInput/formatting'
import { formatValue } from '../TextInput/formatValue'

export type AmountInputChangeEvent =
  ChangeEvent<HTMLInputElement> | CompositionEvent<HTMLInputElement>
type CurrencyMode =
  | { mode?: 'fixed'; currencyOptions?: never; onCurrencyChange?: never }
  | {
      mode: 'selectable'
      currencyOptions: readonly CurrencyOption[]
      onCurrencyChange: (currency: CurrencyEnum) => void
    }
export type AmountInputV2Props = Omit<
  InputGroupInputProps,
  'value' | 'defaultValue' | 'onChange' | 'type'
> &
  AmountFormattingOptions &
  CurrencyMode & {
    value: string | number | undefined
    onChange: (value: string, event: AmountInputChangeEvent) => void
    prefix?: string
    suffix?: string
  }

export const AmountInputV2 = forwardRef<HTMLInputElement, AmountInputV2Props>(
  (
    {
      currency,
      value,
      onChange,
      beforeChangeFormatter,
      chargePricingUnitShortName,
      placeholder,
      prefix,
      suffix,
      mode,
      currencyOptions,
      onCurrencyChange,
      className,
      disabled,
      readOnly,
      onCompositionStart,
      onCompositionEnd,
      ...inputProps
    },
    ref,
  ) => {
    const { translate } = useInternationalization()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const anchor = useRef<HTMLDivElement>(null)
    const composing = useRef(false)
    const completedComposition = useRef<{ raw: string; value: string } | null>(null)
    const [draft, setDraft] = useState<string | null>(null)
    const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
    const displayedValue = String(value ?? '')
    const formatters = defineNewBeforeChangeFormatter({
      currency,
      beforeChangeFormatter,
      chargePricingUnitShortName,
    })
    const defaultPlaceholder = definedDefaultPlaceholder({
      currency,
      chargePricingUnitShortName,
      translate,
    })
    const addon = prefix ?? (mode !== 'selectable' ? currency : '')

    const setInputRef = useCallback(
      (input: HTMLInputElement | null): void => {
        inputRef.current = input
        if (typeof ref === 'function') ref(input)
        else if (ref) ref.current = input
      },
      [ref],
    )

    useEffect(() => {
      composing.current = false
      if (completedComposition.current?.value !== String(value ?? ''))
        completedComposition.current = null
      setDraft(null)
    }, [value])
    useLayoutEffect(() => {
      if (selection && document.activeElement === inputRef.current) {
        inputRef.current?.setSelectionRange(selection.start, selection.end)
      }
    }, [selection])

    const commit = (event: AmountInputChangeEvent): string | null => {
      const raw = event.currentTarget.value
      const formatted = formatValue(raw, formatters)
      const start = event.currentTarget.selectionStart ?? raw.length
      const end = event.currentTarget.selectionEnd ?? start
      const accepted = formatted ?? displayedValue
      const offset = formatted === null ? Math.max(0, raw.length - accepted.length) : 0

      setSelection({
        start: Math.min(accepted.length, Math.max(0, start - offset)),
        end: Math.min(accepted.length, Math.max(0, end - offset)),
      })
      if (formatted !== null) onChange(formatted, event)
      return formatted
    }
    const control = (
      <InputGroup className={cn('v2-amount-control', mode !== 'selectable' && className)}>
        {addon && (
          <InputGroupAddon>
            <InputGroupText>{addon}</InputGroupText>
          </InputGroupAddon>
        )}
        <InputGroupInput
          {...inputProps}
          ref={setInputRef}
          value={draft ?? displayedValue}
          placeholder={placeholder ?? defaultPlaceholder}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(event) => {
            if (composing.current) {
              setDraft(event.currentTarget.value)
              return
            }
            if (
              completedComposition.current &&
              [completedComposition.current.raw, completedComposition.current.value].includes(
                event.currentTarget.value,
              )
            ) {
              completedComposition.current = null
              return
            }
            completedComposition.current = null
            commit(event)
          }}
          onCompositionStart={(event) => {
            composing.current = true
            completedComposition.current = null
            setDraft(event.currentTarget.value)
            onCompositionStart?.(event)
          }}
          onCompositionEnd={(event) => {
            if (composing.current) {
              composing.current = false
              const raw = event.currentTarget.value

              setDraft(null)
              const accepted = commit(event)

              completedComposition.current = { raw, value: accepted ?? displayedValue }
            }
            onCompositionEnd?.(event)
          }}
        />
        {suffix && (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{suffix}</InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>
    )

    if (mode !== 'selectable') return control

    const renderCurrency = (): JSX.Element => {
      if (readOnly)
        return (
          <span
            className="v2-amount-currency v2-amount-currency-readonly"
            data-disabled={disabled || undefined}
          >
            {currency}
          </span>
        )
      return (
        <CurrencyPicker
          currency={currency}
          options={currencyOptions}
          onChange={onCurrencyChange}
          disabled={disabled}
          anchor={anchor}
        />
      )
    }

    return (
      <div ref={anchor} className={cn('v2-amount-input v2-text-body', className)}>
        {renderCurrency()}
        {control}
      </div>
    )
  },
)
AmountInputV2.displayName = 'AmountInputV2'
