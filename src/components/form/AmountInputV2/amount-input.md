# AmountInput

Controlled amount entry with fixed or selectable currency, preserving Lago formatting and precision.

## When to use

Opt-in v2 amount entry for currency amounts, charge prices, credits, percentages and custom units. Existing forms retain the legacy AmountInput. No Formik or TanStack adapter is included.

## Import

Import `AmountInputV2` from `~/components/form/AmountInputV2`. Formatting and currency knowledge stay in the app; presentation reuses lago-ui Input Group, Combobox and Field.

## API

Controlled `value` accepts strings, numbers or undefined; accepted edits emit a string and the original React event. Empty differs from zero. The ref targets the native input. Native accessibility, disabled and readOnly props are forwarded. No defaultValue, number-input coercion or MUI props.

`currency` is required. Fixed mode shows its code by default; `prefix=""` hides it, and prefix/suffix can describe a custom unit. For `mode="selectable"`, supply `currencyOptions` (value/label) and `onCurrencyChange`. Currency and amount remain separate controlled values. Changing currency never converts or immediately reformats the amount; the next edit uses the new precision. Currency labels are caller-provided and searchable alongside codes. The popup virtualizes the supplied options, including the full supported currency list, with measured rows and a 52px estimate for code/name entries.

Retain the existing `beforeChangeFormatter` and `chargePricingUnitShortName` semantics. Currency uses 0/2/3/4 decimals; chargeDecimal permits 15 fractional digits. Editing truncates rather than rounds, preserves decimal trailing dots/zeros, and allows negative values unless positiveNumber is supplied. Custom-unit text does not choose precision. Explicit placeholders override the existing translated defaults. Loaded values are not reformatted. Existing malformed-input quirks remain unchanged; this is not a locale-aware number parser.

## Examples

```tsx
<AmountInputV2 currency={currency} value={amount} onChange={setAmount} />
<AmountInputV2 mode="selectable" currency={currency} currencyOptions={options}
  onCurrencyChange={setCurrency} value={amount} onChange={setAmount} />
```

Compose directly with FieldContent, FieldLabel/FieldDescription, this control and FieldError. Label htmlFor targets the amount input; description/error ids are explicitly associated. Validation and API serialization belong to the caller. Boolean invalid styling works without an error message or Field.

## Accessibility

The selector is left of the amount and precedes it in keyboard order. Its popup uses SearchInput, an edge-to-edge separator and existing Combobox keyboard/focus handling. Clear search never clears selection. Read-only renders currency as text with no chevron. Disabled controls cannot edit or open. Numeric entry uses type=text; callers may choose an inputMode appropriate to their negative/decimal requirements. IME drafts are formatted only when composition ends. No implicit amount clear action.

## Design

36px height; 88px currency selector; amount fills remaining width. Attached corners are square with one divider; outer corners are 8px. Input Group retains 12px padding and 8px addon gaps. The popup anchors to the entire control, not the 88px trigger. Only the focused target has a ring. Field retains 8px/4px spacing. Standalone and Field stories are separate and support both themes.

## References

- [Figma AmountInput](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=360-892)
- [Existing amount behavior](../AmountInput/AmountInput.tsx)

- Storybook: `Components/AmountInput` and `Components/Field` AmountInput examples.
- Tests: [AmountInputV2.test.tsx](__tests__/AmountInputV2.test.tsx), [formatting.test.ts](../AmountInput/__tests__/formatting.test.ts).
