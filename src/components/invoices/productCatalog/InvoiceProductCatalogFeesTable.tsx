import { gql } from '@apollo/client'
import { ReactNode, useMemo } from 'react'

import {
  ComposableTableRow,
  ComposableTableView,
  createComposableTableColumnHelper,
  useComposableTable,
} from '~/components/designSystem/ComposableTable'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone/utils'
import {
  CurrencyEnum,
  FeeForInvoiceProductCatalogSectionFragment,
  InvoiceProductCatalogSectionFragment,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatInvoiceProductFees, InvoiceProductCatalogFeeRow } from './formatInvoiceProductFees'

export const INVOICE_PRODUCT_CATALOG_FEES_TABLE_TEST_ID = 'invoice-product-catalog-fees-table'
export const INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID = 'invoice-product-catalog-fee-row'
export const INVOICE_PRODUCT_CATALOG_GROUP_ROW_TEST_ID = 'invoice-product-catalog-group-row'
export const INVOICE_PRODUCT_CATALOG_DETAIL_ROW_TEST_ID = 'invoice-product-catalog-detail-row'

gql`
  fragment FeeForInvoiceProductCatalogFeesTable on Fee {
    id
    amountCents
    units
    preciseUnitAmount
    rateModel
    properties {
      fromDatetime
      toDatetime
    }
    contract {
      id
    }
    product {
      id
      name
      invoiceDisplayName
    }
    productFilter {
      id
      name
      invoiceDisplayName
    }
    trueUpParentFee {
      id
    }
    appliedTaxes {
      id
      taxRate
    }
    amountDetails {
      fixedFeeTotalAmount
      fixedFeeUnitAmount
      flatUnitAmount
      freeEvents
      freeUnits
      minMaxAdjustmentTotalAmount
      paidEvents
      paidUnits
      perPackageSize
      perPackageUnitAmount
      perUnitAmount
      perUnitTotalAmount
      rate
      units
      graduatedRanges {
        flatUnitAmount
        fromValue
        perUnitAmount
        perUnitTotalAmount
        toValue
        units
      }
      graduatedPercentageRanges {
        flatUnitAmount
        fromValue
        perUnitTotalAmount
        rate
        toValue
        units
      }
    }
  }
`

type Fee = FeeForInvoiceProductCatalogSectionFragment
type Row = InvoiceProductCatalogFeeRow<Fee>
type DetailUnitPrice = NonNullable<Extract<Row, { kind: 'detail' }>['unitPrice']>
type TableRow = ComposableTableRow<Row>
type CellContext = { row: TableRow }

type InvoiceProductCatalogFeesTableProps = {
  fees: Fee[]
  section: Pick<InvoiceProductCatalogSectionFragment, 'products'>
  currency: CurrencyEnum
  customerTimezone?: TimezoneEnum | null
  hasTaxProviderError?: boolean
  isLoading: boolean
  hasError: boolean
  hasActiveSearchOrFilters: boolean
  onRetry: () => void
  onFeeClick: (fee: Fee) => void
}

const columnHelper = createComposableTableColumnHelper<Row>()

const INDENT_STEP_PX = 16

const getIndentLevel = ({ depth, original }: TableRow): number => {
  if (original.kind === 'product' || original.kind === 'filter') return depth

  return depth - 1
}

const formatQuantity = (value: number): string =>
  intlFormatNumber(value, { style: 'decimal', maximumFractionDigits: 6 })

const formatTaxRates = (taxRates: number[]): string => {
  if (!taxRates.length) return intlFormatNumber(0, { style: 'percent' })

  return taxRates.map((taxRate) => intlFormatNumber(taxRate / 100, { style: 'percent' })).join(', ')
}

const renderDetailValue = (value: string): JSX.Element => (
  <Typography variant="body" color="grey600" noWrap>
    {value}
  </Typography>
)

export const InvoiceProductCatalogFeesTable = ({
  fees,
  section,
  currency,
  customerTimezone,
  hasTaxProviderError = false,
  isLoading,
  hasError,
  hasActiveSearchOrFilters,
  onRetry,
  onFeeClick,
}: InvoiceProductCatalogFeesTableProps): JSX.Element => {
  const { translate } = useInternationalization()

  const rows = useMemo(
    () => formatInvoiceProductFees({ fees, section, currency }),
    [fees, section, currency],
  )

  const formatAmount = (value: number): string =>
    intlFormatNumber(value, { currencyDisplay: 'symbol', currency })

  const formatDate = (value: string | null | undefined): string =>
    value ? intlFormatDateTime(value, { timezone: customerTimezone }).date : '-'

  const formatTaxes = (taxRates: number[]): string =>
    hasTaxProviderError ? '-' : formatTaxRates(taxRates)

  const formatUnitPrice = (unitPrice: DetailUnitPrice): string => {
    if (unitPrice.type === 'percent') {
      return intlFormatNumber(unitPrice.value / 100, { style: 'percent', maximumFractionDigits: 6 })
    }

    if (unitPrice.type === 'package') {
      return translate('text_659e67cd63512ef532843074', {
        perPackageUnitAmount: intlFormatNumber(unitPrice.amount, {
          currencyDisplay: 'symbol',
          currency,
          minimumFractionDigits: 2,
          maximumSignificantDigits: 6,
        }),
        perPackageSize: unitPrice.size,
      })
    }

    return intlFormatNumber(unitPrice.value, {
      currencyDisplay: 'symbol',
      currency,
      maximumFractionDigits: 15,
    })
  }

  const getFeeLabel = (row: Extract<Row, { kind: 'fee' }>): string =>
    translate(row.isTrueUp ? 'text_1793976837127ccgy1oexyvt' : 'text_633dae57ca9a923dd53c2097', {
      fromDate: formatDate(row.fee.properties?.fromDatetime),
      toDate: formatDate(row.fee.properties?.toDatetime),
    })

  const renderDescription = ({ row }: CellContext): ReactNode => {
    const { original } = row

    const renderLabel = (): ReactNode => {
      if (original.kind === 'product' || original.kind === 'filter') {
        return (
          <Typography variant="bodyHl" color="grey700" noWrap>
            {original.label}
          </Typography>
        )
      }

      if (original.kind === 'fee') {
        return (
          <Typography variant="body" color="grey700" noWrap>
            {getFeeLabel(original)}
          </Typography>
        )
      }

      return renderDetailValue(translate(original.labelKey, original.labelParams, original.plural))
    }

    return <div style={{ paddingLeft: getIndentLevel(row) * INDENT_STEP_PX }}>{renderLabel()}</div>
  }

  const isFeeWithoutDetails = (original: Row): original is Extract<Row, { kind: 'fee' }> =>
    original.kind === 'fee' && !original.subRows.length

  const renderQuantity = ({ row: { original } }: CellContext): ReactNode => {
    if (isFeeWithoutDetails(original)) return formatQuantity(original.fee.units)
    if (original.kind !== 'detail' || original.quantity === undefined) return null

    return renderDetailValue(formatQuantity(original.quantity))
  }

  const renderUnitPrice = ({ row: { original } }: CellContext): ReactNode => {
    if (isFeeWithoutDetails(original)) {
      return formatUnitPrice({ type: 'amount', value: original.fee.preciseUnitAmount })
    }
    if (original.kind !== 'detail' || !original.unitPrice) return null

    return renderDetailValue(formatUnitPrice(original.unitPrice))
  }

  const renderTaxes = ({ row: { original } }: CellContext): ReactNode => {
    if (isFeeWithoutDetails(original)) {
      return formatTaxes(original.fee.appliedTaxes?.map(({ taxRate }) => taxRate) ?? [])
    }
    if (original.kind !== 'detail') return null

    return renderDetailValue(formatTaxes(original.taxRates))
  }

  const renderAmount = ({ row: { original } }: CellContext): ReactNode => {
    if (original.kind === 'product' || original.kind === 'filter') {
      return (
        <Typography variant="bodyHl" color="grey700" noWrap>
          {formatAmount(deserializeAmount(original.amountCents, currency))}
        </Typography>
      )
    }

    if (isFeeWithoutDetails(original)) {
      return formatAmount(deserializeAmount(original.fee.amountCents || 0, currency))
    }
    if (original.kind !== 'detail') return null

    return renderDetailValue(formatAmount(original.amount))
  }

  const columns = [
    columnHelper.display({
      id: 'description',
      header: translate('text_6388b923e514213fed58331c'),
      cell: renderDescription,
    }),
    columnHelper.display({
      id: 'quantity',
      meta: { variant: 'numeric' },
      header: translate('text_1793977020700qovkg6g58er'),
      cell: renderQuantity,
    }),
    columnHelper.display({
      id: 'unitPrice',
      meta: { variant: 'numeric' },
      header: translate('text_6453819268763979024ad089'),
      cell: renderUnitPrice,
    }),
    columnHelper.display({
      id: 'taxes',
      meta: { variant: 'numeric' },
      header: translate('text_645bb193927b375079d28a8f'),
      cell: renderTaxes,
    }),
    columnHelper.display({
      id: 'amount',
      meta: { variant: 'numeric' },
      header: translate('text_634d631acf4dce7b0127a3a6'),
      cell: renderAmount,
    }),
  ]

  const table = useComposableTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.kind === 'detail' ? undefined : row.subRows),
    initialState: { expanded: true },
  })

  const getRowDataTest = ({ original }: TableRow): string => {
    if (original.kind === 'fee') return `${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-${original.id}`
    if (original.kind === 'detail') {
      return `${INVOICE_PRODUCT_CATALOG_DETAIL_ROW_TEST_ID}-${original.id}`
    }

    return `${INVOICE_PRODUCT_CATALOG_GROUP_ROW_TEST_ID}-${original.id}`
  }

  const emptyState = hasActiveSearchOrFilters
    ? {
        title: translate('text_1793976837127jdvb083z5d7'),
        subtitle: translate('text_1793976837128sy21setbesd'),
      }
    : undefined

  return (
    <ComposableTableView
      table={table}
      isLoading={isLoading}
      loadingRowCount={10}
      hasError={hasError}
      placeholder={{
        emptyState,
        errorState: {
          title: translate('text_629728388c4d2300e2d380d5'),
          subtitle: translate('text_629728388c4d2300e2d380eb'),
          buttonTitle: translate('text_6321a076b94bd1b32494e9f2'),
          buttonVariant: 'primary',
          buttonAction: onRetry,
        },
      }}
      getRowDataTest={getRowDataTest}
      onRowClick={({ original }) => {
        if (original.kind === 'fee') onFeeClick(original.fee)
      }}
      getRowIsClickable={({ original }) => original.kind === 'fee'}
      data-test={INVOICE_PRODUCT_CATALOG_FEES_TABLE_TEST_ID}
    />
  )
}
