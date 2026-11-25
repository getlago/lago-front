# AmountInput

## When to use

Use for a controlled amount with fixed currency or an attached currency selector. Compose label, help, description and error through Field. Formatting policy belongs to the caller; this component does not convert currencies or derive precision. Legacy forms are not migrated automatically.

## Import

```tsx
import { AmountInput } from 'lago-ui/amount-input'
```

## API

- `currency`: currency code, preserving the caller's string union type.
- `value`: string, number or undefined. Accepted edits emit strings through `onChange(value, originalEvent)`. Undefined renders empty; external values are not reformatted.
- `formatValue(rawValue): string | null`: required pure formatting callback. Return an accepted string, including `''`, or `null` to reject an edit. Called while committing edits, with a possible additional call to check the final IME input. An inline callback is supported; changing its identity does not reset a draft or caret. New edits use the latest callback.
- `mode`: `fixed` by default, or `selectable`. Selectable mode requires `currencyOptions`, `onCurrencyChange`, and `currencyLabels` (`trigger`, `search`, `clear`, `empty`). The caller translates labels and updates the trigger label when currency changes.
- `currencyOptions`: readonly `{ value, label }` options; results are virtualized and searchable by code or name.
- `placeholder`: explicit caller-provided placeholder; there is no currency-derived default. An empty string is respected.
- `prefix`, `suffix`: optional text addons. Fixed currency defaults to the currency code; `prefix=""` hides it. Selectable currency stays on the left.
- Native input attributes and an `HTMLInputElement` ref are supported. Use `aria-invalid`, `disabled`, `readOnly`, `aria-describedby`, `id` and `name` as appropriate.

No Formik/TanStack adapter, backend currency enum or translation provider is required. The internal currency picker is not a public package entry point.

## Examples

```tsx
<AmountInput currency="USD" value={amount} onChange={setAmount}
  formatValue={formatAmount} placeholder="0.00" aria-label="Amount" />

<AmountInput mode="selectable" currency={currency} value={amount}
  onChange={setAmount} formatValue={formatAmount} placeholder={placeholder}
  currencyOptions={currencies} onCurrencyChange={setCurrency}
  currencyLabels={translatedLabels} aria-label="Amount" />
```

The app's formatter can capture its existing currency, precision and custom-unit settings. Currency changes update that policy for the next edit; they never convert or immediately round the stored amount. Package stories accept text unchanged to demonstrate control behavior; the Precision, Units and Currency Change And Reset app integration stories use the real app formatting utilities, including USD charge prices with 15 decimals.

## Accessibility

Associate a FieldLabel through htmlFor/id; connect description and error with aria-describedby. Supply localized currency-trigger, search, clear and empty-result labels. Disabled blocks both targets; read-only replaces the currency trigger with noninteractive currency text. Search uses SearchInput inside the popup. Keyboard navigation and focus restoration use the shared Combobox. Caret restoration uses the input's owner document, including iframe previews. IME input is committed at composition end without duplicate onChange emission; external resets cancel pending drafts.

## Design

Reuse Input Group and Combobox popup without visual changes. Control height is 36px; the attached left currency trigger is 88px, with square inner corners and one divider. Preserve semantic tokens, light/dark themes, focus and invalid states. Field retains 8px content-to-control and 4px control-to-error spacing. The popup anchors to the whole control and supports virtualized results.

## References

- [Input Group](input-group.md)
- [Combobox](combobox.md)
- [Field](field.md)
- [Figma AmountInput](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=288-2784)
