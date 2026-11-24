import { CurrencyEnum } from '~/generated/graphql'

import { CurrencyOption } from './CurrencyPicker'

const names = new Intl.DisplayNames(['en'], { type: 'currency' })

export const currencyOptions: CurrencyOption[] = Object.values(CurrencyEnum).map((value) => ({
  value,
  label: names.of(value) ?? value,
}))
