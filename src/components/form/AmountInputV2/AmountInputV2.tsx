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

const mapCaret = (raw: string, formatted: string, position: number): number => {
  let source = 0
  let target = 0

  while (source < position && target < formatted.length) {
    if (raw[source] === formatted[target]) {
      source++
      target++
    } else if (raw[source] === '.' && formatted.startsWith('0.', target)) {
      target++
    } else if (raw.includes(formatted[target], source)) {
      source++
    } else {
      target++
    }
  }
  return target
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
  ): JSX.Element => {
    const { translate } = useInternationalization()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const anchor = useRef<HTMLDivElement>(null)
    const composing = useRef(false)
    const compositionCancelled = useRef(false)
    const compositionTimer = useRef<ReturnType<typeof setTimeout>>()
    const previousSelection = useRef<{ start: number; end: number } | null>(null)
    const completedComposition = useRef<{ raw: string; value: string } | null>(null)
    const [draft, setDraft] = useState<string | null>(null)
    const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
    const displayedValue = String(value ?? '')
    const formatters = defineNewBeforeChangeFormatter({
      currency,
      beforeChangeFormatter,
      chargePricingUnitShortName,
    })
    const formattingKey = JSON.stringify(formatters)
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
      if (composing.current) compositionCancelled.current = true
      if (completedComposition.current?.value !== String(value ?? ''))
        completedComposition.current = null
      setDraft(null)
    }, [value])
    useEffect(() => {
      completedComposition.current = null
    }, [currency, formattingKey])
    useEffect(() => () => clearTimeout(compositionTimer.current), [])

    const captureSelection = (input: HTMLInputElement): void => {
      completedComposition.current = null
      previousSelection.current = {
        start: input.selectionStart ?? 0,
        end: input.selectionEnd ?? 0,
      }
    }

    useLayoutEffect(() => {
      if (selection && inputRef.current?.ownerDocument.activeElement === inputRef.current) {
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

      setSelection(
        formatted === null && previousSelection.current
          ? previousSelection.current
          : {
              start:
                formatted === null ? Math.max(0, start - offset) : mapCaret(raw, accepted, start),
              end: formatted === null ? Math.max(0, end - offset) : mapCaret(raw, accepted, end),
            },
      )
      previousSelection.current = null
      if (formatted !== null) onChange(formatted, event)
      return formatted
    }
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
      if (composing.current) {
        if (!compositionCancelled.current) setDraft(event.currentTarget.value)
        return
      }
      const completed = completedComposition.current

      completedComposition.current = null
      if (completed && [completed.raw, completed.value].includes(event.currentTarget.value)) return
      commit(event)
    }
    const handleCompositionStart = (event: CompositionEvent<HTMLInputElement>): void => {
      captureSelection(event.currentTarget)
      composing.current = true
      compositionCancelled.current = false
      setDraft(event.currentTarget.value)
      onCompositionStart?.(event)
    }
    const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>): void => {
      if (composing.current) {
        composing.current = false
        const raw = event.currentTarget.value

        setDraft(null)
        const accepted = compositionCancelled.current ? displayedValue : commit(event)

        completedComposition.current = { raw, value: accepted ?? displayedValue }
        clearTimeout(compositionTimer.current)
        // Some browsers send one final input immediately after compositionend.
        compositionTimer.current = setTimeout(() => {
          completedComposition.current = null
        }, 0)
      }
      onCompositionEnd?.(event)
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
          onKeyDown={(event) => {
            captureSelection(event.currentTarget)
            inputProps.onKeyDown?.(event)
          }}
          onPaste={(event) => {
            captureSelection(event.currentTarget)
            inputProps.onPaste?.(event)
          }}
          onBeforeInput={(event) => {
            if (!composing.current && !completedComposition.current)
              captureSelection(event.currentTarget)
            inputProps.onBeforeInput?.(event)
          }}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
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
            className="v2-amount-currency v2-amount-currency-readonly flex h-9 items-center rounded-l-lg border border-border-control bg-surface-subtle px-3"
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
      <div
        ref={anchor}
        className={cn('v2-amount-input v2-text-body flex w-full min-w-0', className)}
      >
        {renderCurrency()}
        {control}
      </div>
    )
  },
)
AmountInputV2.displayName = 'AmountInputV2'
