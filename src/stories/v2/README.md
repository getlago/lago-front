# AmountInput app integration

The standalone component is imported from `lago-ui/amount-input`. The integration stories and tests here exercise the existing app formatter without changing v1 or copying its currency rules into the UI package.

```tsx
const formatters = defineNewBeforeChangeFormatter({
  currency,
  beforeChangeFormatter,
  chargePricingUnitShortName,
})

<AmountInput
  currency={currency}
  value={amount}
  onChange={setAmount}
  formatValue={(raw) => formatValue(raw, formatters)}
  placeholder={placeholder ?? definedDefaultPlaceholder({ currency, translate, chargePricingUnitShortName })}
/>
```

Import `defineNewBeforeChangeFormatter` and `definedDefaultPlaceholder` from `~/components/form/AmountInput/formatting`, and `formatValue` from `~/components/form/TextInput/formatValue`. The existing helpers own currency precision, chargeDecimal and custom-unit overrides. The callback returns an accepted string or null to reject an edit; it must be pure. A fresh inline callback on each render is supported.

Selectable mode additionally receives `currencyOptions`, `onCurrencyChange` and translated `currencyLabels`. Keep amount and currency as separate values; changing currency does not convert or reformat the existing amount. See `amount-input-integration.stories.tsx` for the complete example and all supported currencies.

Package stories demonstrate standalone control and Field states with explicit demonstration callbacks. These app stories retain real precision, unit and reset behavior. No production form adapter or wrapper is introduced.
