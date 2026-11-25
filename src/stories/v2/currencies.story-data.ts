import { CurrencyOption } from 'lago-ui/amount-input'

import { CurrencyEnum } from '~/generated/graphql'

const names = new Intl.DisplayNames(['en'], { type: 'currency' })

export const currencyOptions: CurrencyOption<CurrencyEnum>[] = Object.values(CurrencyEnum).map(
  (value) => ({
    value,
    label: names.of(value) ?? value,
  }),
)
