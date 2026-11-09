import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  FeeForInvoiceProductCatalogFeesTableFragment,
  InvoiceProductCatalogSectionFragment,
  RateCardRateModelEnum,
} from '~/generated/graphql'

type Fee = FeeForInvoiceProductCatalogFeesTableFragment
type AmountDetails = NonNullable<Fee['amountDetails']>
type GraduatedRange = {
  flatUnitAmount?: string | null
  fromValue?: number | string | null
  toValue?: number | string | null
}

type InvoiceProductCatalogDetailUnitPrice =
  | { type: 'amount'; value: number }
  | { type: 'percent'; value: number }
  | { type: 'package'; amount: number; size: number }

type DetailLine = {
  labelKey: string
  labelParams?: Record<string, number>
  plural?: number
  quantity?: number
  unitPrice?: InvoiceProductCatalogDetailUnitPrice
  amount: number
}

type GroupRow<TFee extends Fee> = {
  id: string
  label: string
  amountCents: string
  subRows: InvoiceProductCatalogFeeRow<TFee>[]
}

export type InvoiceProductCatalogFeeRow<TFee extends Fee = Fee> =
  | (GroupRow<TFee> & { kind: 'product' })
  | (GroupRow<TFee> & { kind: 'filter' })
  | {
      kind: 'fee'
      id: string
      fee: TFee
      isTrueUp: boolean
      subRows: InvoiceProductCatalogFeeRow<TFee>[]
    }
  | (DetailLine & { kind: 'detail'; id: string; taxRates: number[] })

const RANGE_LABEL_KEYS = {
  first: { unit: 'text_1793976837126k8ncia8jumj', flat: 'text_1793976837127voxh0bkw837' },
  middle: { unit: 'text_17939768371273u15rqlfi7v', flat: 'text_17939768371278cqhh1rqafz' },
  last: { unit: 'text_1793976837127fht81ak29xk', flat: 'text_1793976837127aw1xks2iyyi' },
}

const toNumber = (value: string | number | null | undefined): number => Number(value || 0)

const getRangeLabel = (
  range: GraduatedRange,
  isFlat: boolean,
): Pick<DetailLine, 'labelKey' | 'labelParams'> => {
  const variant = isFlat ? 'flat' : 'unit'

  if (range.toValue === null || range.toValue === undefined) {
    return { labelKey: RANGE_LABEL_KEYS.last[variant] }
  }

  const position = toNumber(range.fromValue) === 0 ? 'first' : 'middle'

  return {
    labelKey: RANGE_LABEL_KEYS[position][variant],
    labelParams: { toValue: toNumber(range.toValue) },
  }
}

const getFlatRangeLines = (ranges: GraduatedRange[]): DetailLine[] =>
  ranges.flatMap((range) => {
    if (toNumber(range.flatUnitAmount) === 0) return []

    const flatUnitAmount = toNumber(range.flatUnitAmount)

    return [
      {
        ...getRangeLabel(range, true),
        quantity: 1,
        unitPrice: { type: 'amount', value: flatUnitAmount },
        amount: flatUnitAmount,
      },
    ]
  })

const getGraduatedLines = ({ graduatedRanges }: AmountDetails): DetailLine[] => {
  const ranges = graduatedRanges ?? []

  return [
    ...ranges.map((range): DetailLine => ({
      ...getRangeLabel(range, false),
      quantity: toNumber(range.units),
      unitPrice: { type: 'amount', value: toNumber(range.perUnitAmount) },
      amount: toNumber(range.perUnitTotalAmount),
    })),
    ...getFlatRangeLines(ranges),
  ]
}

const getGraduatedPercentageLines = ({
  graduatedPercentageRanges,
}: AmountDetails): DetailLine[] => {
  const ranges = graduatedPercentageRanges ?? []

  return [
    ...ranges.map((range): DetailLine => ({
      ...getRangeLabel(range, false),
      quantity: toNumber(range.units),
      unitPrice: { type: 'percent', value: toNumber(range.rate) },
      amount: toNumber(range.perUnitTotalAmount),
    })),
    ...getFlatRangeLines(ranges),
  ]
}

const getVolumeLines = (amountDetails: AmountDetails, fee: Fee): DetailLine[] => {
  const flatUnitAmount = toNumber(amountDetails.flatUnitAmount)

  if (flatUnitAmount <= 0) return []

  return [
    {
      labelKey: 'text_659e67cd63512ef532843078',
      quantity: toNumber(fee.units),
      unitPrice: { type: 'amount', value: toNumber(amountDetails.perUnitAmount) },
      amount: toNumber(amountDetails.perUnitTotalAmount),
    },
    {
      labelKey: 'text_659e67cd63512ef5328430b5',
      quantity: 1,
      unitPrice: { type: 'amount', value: flatUnitAmount },
      amount: flatUnitAmount,
    },
  ]
}

const getPackageLines = (
  amountDetails: AmountDetails,
  fee: Fee,
  currency: CurrencyEnum,
): DetailLine[] => {
  const freeUnits = toNumber(amountDetails.freeUnits)
  const freeUnitsLines: DetailLine[] =
    freeUnits > 0
      ? [
          {
            labelKey: 'text_659e67cd63512ef53284303c',
            labelParams: { freeUnits },
            quantity: freeUnits,
            unitPrice: { type: 'amount', value: 0 },
            amount: 0,
          },
        ]
      : []

  return [
    ...freeUnitsLines,
    {
      labelKey: 'text_659e67cd63512ef532843064',
      quantity: toNumber(amountDetails.paidUnits),
      unitPrice: {
        type: 'package',
        amount: toNumber(amountDetails.perPackageUnitAmount),
        size: toNumber(amountDetails.perPackageSize),
      },
      amount: deserializeAmount(fee.amountCents || 0, currency),
    },
  ]
}

const getPercentageLines = (amountDetails: AmountDetails): DetailLine[] => {
  const freeUnits = toNumber(amountDetails.freeUnits)
  const freeEvents = toNumber(amountDetails.freeEvents)
  const fixedFeeUnitAmount = toNumber(amountDetails.fixedFeeUnitAmount)
  const fixedFeeTotalAmount = toNumber(amountDetails.fixedFeeTotalAmount)
  const minMaxAdjustmentTotalAmount = toNumber(amountDetails.minMaxAdjustmentTotalAmount)
  const lines: DetailLine[] = []

  if (freeUnits > 0) {
    lines.push({
      labelKey: 'text_659e67cd63512ef532843046',
      labelParams: { freeEvents },
      plural: freeEvents,
      quantity: freeUnits,
      unitPrice: { type: 'amount', value: 0 },
      amount: 0,
    })
  }

  lines.push({
    labelKey: 'text_659e67cd63512ef53284306e',
    quantity: toNumber(amountDetails.paidUnits),
    unitPrice: { type: 'percent', value: toNumber(amountDetails.rate) },
    amount: toNumber(amountDetails.perUnitTotalAmount),
  })

  if (fixedFeeUnitAmount > 0 || fixedFeeTotalAmount > 0) {
    lines.push({
      labelKey: 'text_659e67cd63512ef53284308f',
      quantity: toNumber(amountDetails.paidEvents),
      unitPrice: { type: 'amount', value: fixedFeeUnitAmount },
      amount: fixedFeeTotalAmount,
    })
  }

  if (minMaxAdjustmentTotalAmount !== 0) {
    lines.push({ labelKey: 'text_659e67cd63512ef5328430ad', amount: minMaxAdjustmentTotalAmount })
  }

  return lines
}

const noLines = (): DetailLine[] => []

const DETAIL_LINES_BY_RATE_MODEL: Record<
  RateCardRateModelEnum,
  (amountDetails: AmountDetails, fee: Fee, currency: CurrencyEnum) => DetailLine[]
> = {
  [RateCardRateModelEnum.Custom]: noLines,
  [RateCardRateModelEnum.Dynamic]: noLines,
  [RateCardRateModelEnum.Standard]: noLines,
  [RateCardRateModelEnum.Graduated]: getGraduatedLines,
  [RateCardRateModelEnum.GraduatedPercentage]: getGraduatedPercentageLines,
  [RateCardRateModelEnum.Volume]: getVolumeLines,
  [RateCardRateModelEnum.Package]: getPackageLines,
  [RateCardRateModelEnum.Percentage]: getPercentageLines,
}

const buildDetailRows = <TFee extends Fee>(
  fee: TFee,
  currency: CurrencyEnum,
): InvoiceProductCatalogFeeRow<TFee>[] => {
  if (fee.trueUpParentFee || !fee.rateModel || !fee.amountDetails) return []

  const taxRates = fee.appliedTaxes?.map(({ taxRate }) => taxRate) ?? []

  return DETAIL_LINES_BY_RATE_MODEL[fee.rateModel](fee.amountDetails, fee, currency).map(
    (line, index) => ({ ...line, kind: 'detail', id: `${fee.id}-detail-${index}`, taxRates }),
  )
}

const getDisplayName = (
  entity: { name: string; invoiceDisplayName?: string | null } | null | undefined,
): string => entity?.invoiceDisplayName || entity?.name || ''

export const formatInvoiceProductFees = <TFee extends Fee>({
  fees,
  section,
  currency,
}: {
  fees: TFee[]
  section: Pick<InvoiceProductCatalogSectionFragment, 'products'>
  currency: CurrencyEnum
}): InvoiceProductCatalogFeeRow<TFee>[] => {
  const rows: InvoiceProductCatalogFeeRow<TFee>[] = []
  let currentProduct: { key: string; row: GroupRow<TFee>; hasTotal: boolean } | undefined
  let currentFilter: { id: string; row: GroupRow<TFee>; hasTotal: boolean } | undefined
  const groupIdCounts = new Map<string, number>()

  const getGroupRowId = (baseId: string): string => {
    const count = groupIdCounts.get(baseId) ?? 0

    groupIdCounts.set(baseId, count + 1)

    return count ? `${baseId}-${count}` : baseId
  }

  const addFallbackTotal = (
    group: { row: GroupRow<TFee>; hasTotal: boolean } | undefined,
    amountCents: TFee['amountCents'],
  ): void => {
    if (!group || group.hasTotal) return

    group.row.amountCents = String(toNumber(group.row.amountCents) + toNumber(amountCents))
  }

  fees.forEach((fee) => {
    const productId = fee.product?.id ?? ''
    const productKey = `${fee.contract?.id ?? ''}:${productId}`
    const productGroup = section.products.find(({ product }) => product.id === productId)

    if (currentProduct?.key !== productKey) {
      const row: InvoiceProductCatalogFeeRow<TFee> = {
        kind: 'product',
        id: getGroupRowId(`product-${productId}`),
        label: getDisplayName(productGroup?.product ?? fee.product),
        amountCents: String(productGroup?.amountCents ?? '0'),
        subRows: [],
      }

      rows.push(row)
      currentProduct = { key: productKey, row, hasTotal: !!productGroup }
      currentFilter = undefined
    }

    const filterId = fee.productFilter?.id
    let parentRows = currentProduct.row.subRows

    if (filterId) {
      if (currentFilter?.id !== filterId) {
        const filterGroup = productGroup?.filters.find(
          ({ productFilter }) => productFilter.id === filterId,
        )
        const row: InvoiceProductCatalogFeeRow<TFee> = {
          kind: 'filter',
          id: getGroupRowId(`filter-${filterId}`),
          label: getDisplayName(filterGroup?.productFilter ?? fee.productFilter),
          amountCents: String(filterGroup?.amountCents ?? '0'),
          subRows: [],
        }

        parentRows.push(row)
        currentFilter = { id: filterId, row, hasTotal: !!filterGroup }
      }

      parentRows = currentFilter.row.subRows
    } else {
      currentFilter = undefined
    }

    parentRows.push({
      kind: 'fee',
      id: fee.id,
      fee,
      isTrueUp: !!fee.trueUpParentFee,
      subRows: buildDetailRows(fee, currency),
    })

    addFallbackTotal(currentProduct, fee.amountCents)
    addFallbackTotal(currentFilter, fee.amountCents)
  })

  return rows
}
