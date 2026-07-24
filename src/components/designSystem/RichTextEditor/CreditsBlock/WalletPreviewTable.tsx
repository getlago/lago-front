import { PreviewTable, type PreviewTableColumn } from '~/components/designSystem/Table/PreviewTable'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import type {
  WalletBilled,
  WalletPreviewData,
  WalletPreviewRow,
  WalletPrice,
  WalletUnits,
} from '~/core/serializers/buildWalletPreviewData'
import { DateFormat, intlFormatDateTime } from '~/core/timezone/utils'
import type { LocaleEnum } from '~/core/translations'
import { CurrencyEnum, FeeTypesEnum, RecurringTransactionIntervalEnum } from '~/generated/graphql'
import type { TranslateFunc } from '~/hooks/core/useInternationalization'

export const WALLET_PREVIEW_TABLE_TEST_ID = 'preview-table-wallet-preview'

// The preview renders in the customer's locale via the contextual-locale translator,
// which does NOT fall back to English — every referenced key must exist in each locale
// file. Column headers + tax footer are already shipped to all locales; the labels below
// are wallet-owned keys added to every locale so the preview never shows a raw key id.
const K = {
  // Generic quote-preview table headers + tax footer (present in all locales).
  colName: 'text_178222304861526lr006rl38',
  colBilled: 'text_17822230486157n020egd1q3',
  colUnits: 'text_1782223048615rmf57qlo7ka',
  colPrice: 'text_17822230486157sa0x6qnkwn',
  taxFooter: 'text_17804985042422iw5hwj0u2v',
  // Wallet-owned labels (added to every locale).
  freeCredits: 'text_1784883525803ne7j9k70cy2',
  recurringTopUp: 'text_17848821795797viukiwsvkd',
  oneTime: 'text_1784882179579jrpo7xq992a',
  free: 'text_1784882179579muknx9hd8bw',
  expires: 'text_1784882179579v64foe5ytas',
  appliesTo: 'text_1784882179580txsoj9pf51f',
  appliesToAll: 'text_1784882179580hb24cd5e4jc',
  onLowBalance: 'text_17848821795809xtwzsq7ot9',
  upTo: 'text_178488217958075syit8qyd5',
} as const

type ScopedFeeType = FeeTypesEnum.Charge | FeeTypesEnum.Commitment | FeeTypesEnum.Subscription
const FEE_TYPE_LABEL_KEYS: Record<ScopedFeeType, string> = {
  [FeeTypesEnum.Charge]: 'text_1784883525803oz45f5x0ier',
  [FeeTypesEnum.Commitment]: 'text_1784883525803dqcjtvdskqq',
  [FeeTypesEnum.Subscription]: 'text_1784883525803z2r3s9910of',
}

const INTERVAL_LABEL_KEYS: Partial<Record<RecurringTransactionIntervalEnum, string>> = {
  [RecurringTransactionIntervalEnum.Monthly]: 'text_1784883525803lunzztlh547',
  [RecurringTransactionIntervalEnum.Quarterly]: 'text_1784883525803zcmgdkvi3vd',
  [RecurringTransactionIntervalEnum.Weekly]: 'text_1784883525803guz1xdk6ub7',
  [RecurringTransactionIntervalEnum.Semiannual]: 'text_17848835258036aevge8fx0s',
  [RecurringTransactionIntervalEnum.Yearly]: 'text_1784883525803ghc0vq94t5u',
}

interface WalletPreviewTableProps {
  data: WalletPreviewData
  translate: TranslateFunc
  currency: CurrencyEnum
  locale?: LocaleEnum
}

export const WalletPreviewTable = ({
  data,
  translate,
  currency,
  locale,
}: WalletPreviewTableProps) => {
  const formatBilled = (billed: WalletBilled): string => {
    if (billed.type === 'oneTime') return translate(K.oneTime)
    if (billed.type === 'threshold') return translate(K.onLowBalance)
    if (billed.type === 'interval') {
      const key = INTERVAL_LABEL_KEYS[billed.interval as RecurringTransactionIntervalEnum]

      return key ? translate(key) : ''
    }

    return '—'
  }

  const formatUnits = (units: WalletUnits): string => {
    if (units.type === 'upTo') return translate(K.upTo, { count: units.value })

    return String(units.value)
  }

  const formatPrice = (price: WalletPrice): string => {
    if (price.type === 'free') return translate(K.free)
    if (price.type === 'empty') return ''

    return intlFormatNumber(Number.parseFloat(price.amount || '0'), { currency, locale })
  }

  const scopeLabel = (): string => {
    const feeLabels = data.appliesTo.feeTypes
      .map((ft) => FEE_TYPE_LABEL_KEYS[ft as ScopedFeeType])
      .filter(Boolean)
      .map((key) => translate(key))
    const parts = [...feeLabels, ...data.appliesTo.billableMetricCodes]

    if (parts.length === 0) return translate(K.appliesToAll)

    return translate(K.appliesTo, { scope: parts.join(', ') })
  }

  const captionText = (): string => {
    const parts: string[] = []

    if (data.expirationAt) {
      const date = intlFormatDateTime(data.expirationAt, {
        locale,
        formatDate: DateFormat.DATE_MED,
      }).date

      parts.push(translate(K.expires, { date }))
    }
    parts.push(scopeLabel())

    return parts.join(' · ')
  }

  const rowLabel = (row: WalletPreviewRow): string => {
    if (row.kind === 'free') return translate(K.freeCredits)
    if (row.kind === 'recurring') {
      return row.transactionName
        ? `${translate(K.recurringTopUp)} · ${row.transactionName}`
        : translate(K.recurringTopUp)
    }

    return data.name
  }

  const renderName = (row: WalletPreviewRow) => {
    if (row.isPrimary) {
      return (
        <div className="flex flex-col gap-1">
          <Typography variant="bodyHl" color="grey700">
            {data.name}
          </Typography>
          <Typography variant="caption" color="grey600">
            {captionText()}
          </Typography>
        </div>
      )
    }

    return (
      <Typography variant="bodyHl" color="grey700">
        {rowLabel(row)}
      </Typography>
    )
  }

  const columns: PreviewTableColumn<WalletPreviewRow>[] = [
    {
      key: 'name',
      title: translate(K.colName),
      maxSpace: true,
      content: (row) => renderName(row),
    },
    {
      key: 'billed',
      title: translate(K.colBilled),
      minWidth: 160,
      textAlign: 'right',
      content: (row) => (
        <Typography variant="body" color="grey700">
          {formatBilled(row.billed)}
        </Typography>
      ),
    },
    {
      key: 'units',
      title: translate(K.colUnits),
      minWidth: 160,
      textAlign: 'right',
      content: (row) => (
        <Typography variant="body" color="grey700">
          {formatUnits(row.units)}
        </Typography>
      ),
    },
    {
      key: 'price',
      title: translate(K.colPrice),
      minWidth: 180,
      textAlign: 'right',
      content: (row) => (
        <Typography variant="body" color="grey700">
          {formatPrice(row.price)}
        </Typography>
      ),
    },
  ]

  return (
    <PreviewTable
      name="wallet-preview"
      data={data.rows}
      columns={columns}
      footer={
        <Typography variant="caption" className="mt-3 text-right">
          {translate(K.taxFooter)}
        </Typography>
      }
    />
  )
}
