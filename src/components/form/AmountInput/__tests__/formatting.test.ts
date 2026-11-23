import { CurrencyEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { formatValue } from '../../TextInput/formatValue'
import {
  AmountFormattingOptions,
  definedDefaultPlaceholder,
  defineNewBeforeChangeFormatter,
} from '../formatting'

const translate: TranslateFunc = (key, _data, plural) => `${key}:${plural ?? ''}`

it.each<[Partial<AmountFormattingOptions>, string, string | null]>([
  [{}, '001.20', '001.20'],
  [{}, '1.', '1.'],
  [{}, '.5', ''],
  [{}, '12abc', null],
  [{}, '1,23', null],
  [{}, '1e3', '1'],
  [{}, '1..2', '1.'],
  [{}, '1-2', '1'],
  [{ beforeChangeFormatter: 'chargeDecimal' }, '12abc', '12'],
  [{ beforeChangeFormatter: 'chargeDecimal' }, '1,23', '1'],
  [{ beforeChangeFormatter: ['positiveNumber', 'chargeDecimal'] }, '12abc', null],
  [{ beforeChangeFormatter: 'sextDecimal' }, '1.234567', '1.23'],
  [{ currency: CurrencyEnum.Jpy, chargePricingUnitShortName: 'unit' }, '1.2345', '1.23'],
  [
    {
      currency: CurrencyEnum.Jpy,
      chargePricingUnitShortName: 'unit',
      beforeChangeFormatter: 'chargeDecimal',
    },
    '1.1234567890123456',
    '1.123456789012345',
  ],
  [{ beforeChangeFormatter: 'positiveNumber' }, '-', ''],
  [{}, '-', '-'],
])('preserves the formatter pipeline for %j and %s', (options, raw, expected) => {
  expect(
    formatValue(raw, defineNewBeforeChangeFormatter({ currency: CurrencyEnum.Usd, ...options })),
  ).toBe(expected)
})
it('keeps placeholder selection independent of charge precision', () => {
  expect(definedDefaultPlaceholder({ currency: CurrencyEnum.Jpy, translate })).toBe(
    'text_63971043c9668f1ba5221bac:0',
  )
  expect(
    definedDefaultPlaceholder({
      currency: CurrencyEnum.Jpy,
      translate,
      chargePricingUnitShortName: 'unit',
    }),
  ).toBe('text_63971043c9668f1ba5221bac:1')
})
