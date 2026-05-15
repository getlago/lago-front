import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { DateTime } from 'luxon'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { NavigationTab, TabManagedBy } from '~/components/designSystem/NavigationTab'
import { Table } from '~/components/designSystem/Table'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { useDrawer } from '~/components/drawers/useDrawer'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { DetailRow, GRID } from '~/components/wallets/WalletDetailsDrawer'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { FeeForViewFeeDetailsDrawerFragment, FeeTypesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  VIEW_FEE_DETAILS_DRAWER_TEST_ID,
  VIEW_FEE_DETAILS_HEADER_TEST_ID,
  VIEW_FEE_DETAILS_OVERVIEW_TEST_ID,
  VIEW_FEE_DETAILS_PGK_TABLE_TEST_ID,
  VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID,
} from './invoiceDetailsTestIds'

gql`
  fragment FeeForViewFeeDetailsDrawer on Fee {
    id
    amountCents
    amountCurrency
    preciseAmountCents
    preciseCouponsAmountCents
    subTotalExcludingTaxesAmountCents
    subTotalExcludingTaxesPreciseAmountCents
    taxesRate
    taxesAmountCents
    taxesPreciseAmountCents
    totalAmountCents
    preciseTotalAmountCents
    units
    eventsCount
    payInAdvance
    feeType
    itemCode
    itemName
    itemType
    invoiceDisplayName
    properties {
      fromDatetime
      toDatetime
    }
    trueUpParentFee {
      id
    }
    subscription {
      id
      plan {
        id
        name
        interval
      }
    }
    charge {
      id
      invoiceable
      billableMetric {
        id
      }
    }
    fixedCharge {
      id
      addOn {
        id
      }
    }
    addOn {
      id
    }
    presentationBreakdowns {
      presentationBy
      units
    }
  }
`

type ViewFeeDetailsDrawerProps = {
  fee: FeeForViewFeeDetailsDrawerFragment
}

export interface ViewFeeDetailsDrawerRef {
  openDrawer: (data: ViewFeeDetailsDrawerProps) => unknown
  closeDrawer: () => unknown
}

// Spec'd format is `MMMM D, YYYY - HH:mm:ss UTC` (e.g. May 11, 2026 - 14:32:05 UTC).
// The shared `intlFormatDateTime` helper returns the timezone as `UTC+0:00`, so
// we hand-roll the format with luxon here for an exact spec match.
const formatFeeDate = (iso: string | null | undefined): string => {
  if (iso === null || iso === undefined) return '-'
  return DateTime.fromISO(iso, { zone: 'utc' }).toFormat("LLLL d, yyyy - HH:mm:ss 'UTC'")
}

type ViewFeeDetailsHeaderProps = {
  fee: FeeForViewFeeDetailsDrawerFragment
}

const buildFeeTitle = (
  fee: FeeForViewFeeDetailsDrawerFragment,
  translate: ReturnType<typeof useInternationalization>['translate'],
): string => {
  // Only subscription fees should be titled by plan + interval. Charges,
  // fixed charges, add-ons, etc. share the same subscription association but
  // refer to a different concept (a billable metric, an add-on, …), so the
  // plan-based label is misleading there.
  if (fee.feeType === FeeTypesEnum.Subscription) {
    const planName = fee.subscription?.plan?.name
    const planInterval = fee.subscription?.plan?.interval

    if (
      planName !== null &&
      planName !== undefined &&
      planInterval !== null &&
      planInterval !== undefined
    ) {
      return translate('text_1778489273044dawd3fh19ga', { interval: planInterval, name: planName })
    }
  }

  return fee.invoiceDisplayName || fee.itemName
}

const ViewFeeDetailsHeader = ({ fee }: ViewFeeDetailsHeaderProps) => {
  const currency = fee.amountCurrency
  const { translate } = useInternationalization()
  const title = buildFeeTitle(fee, translate)

  return (
    <header
      data-test={VIEW_FEE_DETAILS_HEADER_TEST_ID}
      className="flex items-start justify-between gap-4"
    >
      <div className="flex flex-col gap-1">
        <Typography variant="headline" color="grey700">
          {title}
        </Typography>
        <Typography variant="caption" color="grey600">
          {fee.id}
        </Typography>
      </div>
      <Typography variant="headline" color="grey700">
        {intlFormatNumber(deserializeAmount(fee.amountCents, currency), {
          currencyDisplay: 'symbol',
          currency,
        })}
      </Typography>
    </header>
  )
}

type OverviewContentProps = {
  fee: FeeForViewFeeDetailsDrawerFragment
  showParentIdRow: boolean
}

const OverviewContent = ({ fee, showParentIdRow }: OverviewContentProps) => {
  const { translate } = useInternationalization()
  const currency = fee.amountCurrency

  const sourceItemId =
    fee.charge?.billableMetric?.id ??
    fee.fixedCharge?.addOn?.id ??
    fee.addOn?.id ??
    fee.subscription?.plan?.id ??
    '-'

  const formatCurrency = (value: string | number | null | undefined) =>
    intlFormatNumber(deserializeAmount(value ?? 0, currency), {
      currencyDisplay: 'symbol',
      currency,
    })

  return (
    <div className="flex flex-col gap-12">
      <section data-test={VIEW_FEE_DETAILS_OVERVIEW_TEST_ID} className="flex flex-col gap-4">
        <Typography variant="subhead1" color="grey700">
          {translate('text_1778485363573x86iip8zvol')}
        </Typography>
        <div className={tw(GRID)}>
          <DetailRow
            label={translate('text_1778485363573m3z3vhkli9m')}
            value={<TypographyWithCopy>{fee.id}</TypographyWithCopy>}
          />
          {showParentIdRow && !!fee.trueUpParentFee?.id && (
            <DetailRow
              label={translate('text_1778485363573omt0phjqyjf')}
              value={<TypographyWithCopy>{fee.trueUpParentFee.id}</TypographyWithCopy>}
            />
          )}
          <DetailRow
            label={translate('text_1778485363573g1bx23ms20d')}
            value={formatFeeDate(fee.properties?.fromDatetime)}
          />
          <DetailRow
            label={translate('text_1778485363573qufhnafv1s7')}
            value={formatFeeDate(fee.properties?.toDatetime)}
          />
          <DetailRow
            label={translate('text_1778490892190yz0uiowyheu')}
            value={translate(
              fee.payInAdvance ? 'text_17440181167432q7jzt9znuh' : 'text_1744018116743ntlygtcnq95',
            )}
          />
          <DetailRow
            label={translate('text_1778490892190exazejgkryd')}
            value={translate(
              !!fee?.charge?.invoiceable
                ? 'text_17440181167432q7jzt9znuh'
                : 'text_1744018116743ntlygtcnq95',
            )}
          />
          <DetailRow label={translate('text_1778485363573rg5koelt3xl')} value={String(fee.units)} />
          <DetailRow
            label={translate('text_1778485363573t3ualwsek49')}
            value={String(fee.eventsCount ?? 0)}
          />
          <DetailRow
            label={translate('text_17784853635736lythk93pix')}
            value={fee.amountCurrency}
          />
          <DetailRow
            label={translate('text_1778485363573ak0q09qqld2')}
            value={formatCurrency(fee.amountCents)}
          />
          <DetailRow
            label={translate('text_1778490892190t88x76715na')}
            value={String(fee.preciseAmountCents)}
          />
          <DetailRow
            label={translate('text_1778490892190ehl0skg0k5j')}
            value={formatCurrency(-fee.preciseCouponsAmountCents)}
          />
          <DetailRow
            label={translate('text_1778490892190l3jpvmw0buv')}
            value={formatCurrency(fee.subTotalExcludingTaxesAmountCents)}
          />
          <DetailRow
            label={translate('text_1778490892190oyfk8pf7p2f')}
            value={String(fee.subTotalExcludingTaxesPreciseAmountCents)}
          />
          <DetailRow
            label={translate('text_1778485363573vsznzlvuo73')}
            value={`${fee.taxesRate ?? 0}%`}
          />
          <DetailRow
            label={translate('text_1778485363573qqb7v9a7lqc')}
            value={formatCurrency(fee.taxesAmountCents)}
          />
          <DetailRow
            label={translate('text_1778490892190k2ufb6mtgsv')}
            value={String(fee.taxesPreciseAmountCents)}
          />
          <DetailRow
            label={translate('text_1778490892190wmqatogkxyd')}
            value={formatCurrency(fee.totalAmountCents)}
          />
          <DetailRow
            label={translate('text_1778490892190r05w5pkp0cq')}
            value={String(fee.preciseTotalAmountCents)}
          />
        </div>
      </section>

      <section data-test={VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID} className="flex flex-col gap-4">
        <Typography variant="subhead1" color="grey700">
          {translate('text_1778485363573o8h8xpr4qyj')}
        </Typography>
        <div className={tw(GRID)}>
          <DetailRow label={translate('text_1778485363574w7zyl8tilba')} value={fee.feeType} />
          <DetailRow
            label={translate('text_1778485363574dygtpz792rx')}
            value={<TypographyWithCopy>{fee.itemCode}</TypographyWithCopy>}
          />
          <DetailRow label={translate('text_177848536357404anic3s604')} value={fee.itemName} />
          {!!fee.invoiceDisplayName && (
            <DetailRow
              label={translate('text_1778485363574e70wgua8cxw')}
              value={fee.invoiceDisplayName}
            />
          )}
          <DetailRow label={translate('text_1778485363574gqoz4lwxrb6')} value={fee.itemType} />
          {sourceItemId !== '-' && (
            <DetailRow
              label={translate('text_17784853635746778oyfl0yh')}
              value={<TypographyWithCopy>{sourceItemId}</TypographyWithCopy>}
            />
          )}
        </div>
      </section>
    </div>
  )
}

type PresentationGroupKeyTableProps = {
  fee: FeeForViewFeeDetailsDrawerFragment
}

const PresentationGroupKeyTable = ({ fee }: PresentationGroupKeyTableProps) => {
  const { translate } = useInternationalization()
  const breakdowns = fee.presentationBreakdowns

  if (!breakdowns?.length) {
    return null
  }

  const firstPresentationBy = breakdowns.find((b) => !!b.presentationBy)?.presentationBy as
    | Record<string, unknown>
    | undefined

  if (!firstPresentationBy) {
    return null
  }

  const columnKeys = Object.keys(firstPresentationBy)

  const header =
    `${translate('text_1778496527600jgpur5fmwi5')} ${columnKeys[0]}` +
    (columnKeys[1] ? ` ${translate('text_1778496527600i320tl9y47e')} ${columnKeys[1]}` : '')

  // The design-system Table requires each row to have a string `id`. Breakdowns
  // from the API don't have one — synthesise a stable index-based id.
  type Row = {
    id: string
    presentationBy: Record<string, unknown>
    units: string
  }
  const rows: Row[] = breakdowns.map((b, i) => ({
    id: `breakdown-${i}`,
    presentationBy: (b.presentationBy ?? {}) as Record<string, unknown>,
    units: b.units,
  }))

  return (
    <div className="flex flex-col gap-4">
      <Typography variant="subhead1" color="grey700">
        {translate('text_1778496527600awcxxc1uust')}
      </Typography>

      <Table
        name={VIEW_FEE_DETAILS_PGK_TABLE_TEST_ID}
        data={rows}
        containerSize={0}
        columns={[
          {
            key: 'id',
            maxSpace: true,
            title: (
              <Typography variant="captionHl" color="grey600">
                {header}
              </Typography>
            ),
            content: ({ presentationBy }) => (
              <div className="flex gap-1">
                {columnKeys.map((key) => (
                  <Chip key={key} label={String(presentationBy?.[key] ?? '-')} />
                ))}
              </div>
            ),
          },
          {
            key: 'units',
            title: (
              <Typography variant="captionHl" color="grey600">
                {translate('text_1778485363573rg5koelt3xl')}
              </Typography>
            ),
            content: ({ units }) => (
              <Typography variant="body" color="grey700">
                {units}
              </Typography>
            ),
          },
        ]}
      />
    </div>
  )
}

const ViewFeeDetailsBody = ({ fee }: { fee: FeeForViewFeeDetailsDrawerFragment }) => {
  const { translate } = useInternationalization()
  const [tabIndex, setTabIndex] = useState(0)
  const hasBreakdowns = (fee.presentationBreakdowns?.length ?? 0) > 0

  return (
    <MemoryRouter>
      <div data-test={VIEW_FEE_DETAILS_DRAWER_TEST_ID}>
        <CenteredPage.SectionWrapper>
          <div>
            <ViewFeeDetailsHeader fee={fee} />

            {hasBreakdowns && (
              <NavigationTab
                managedBy={TabManagedBy.INDEX}
                currentTab={tabIndex}
                onChange={(index) => setTabIndex(index)}
                className="mb-12 mt-4"
                tabs={[
                  {
                    title: translate('text_17784853635748xbwslxipeo'),
                    component: <OverviewContent fee={fee} showParentIdRow={true} />,
                  },
                  {
                    title: translate('text_1778487825608a08eizdrt7y'),
                    component: <PresentationGroupKeyTable fee={fee} />,
                  },
                ]}
              />
            )}
          </div>

          {!hasBreakdowns && <OverviewContent fee={fee} showParentIdRow={false} />}
        </CenteredPage.SectionWrapper>
      </div>
    </MemoryRouter>
  )
}

export const ViewFeeDetailsDrawer = forwardRef<ViewFeeDetailsDrawerRef>((_, ref) => {
  const { translate } = useInternationalization()
  const viewFeeDetailsDrawer = useDrawer()

  const openViewFeeDetailsDrawer = (data: ViewFeeDetailsDrawerProps) => {
    viewFeeDetailsDrawer.open({
      title: translate('text_1778496527600pn3sn6m4ni0'),
      children: <ViewFeeDetailsBody key={data.fee.id} fee={data.fee} />,
      actions: (
        <div className="flex items-center justify-end gap-3">
          <Button onClick={() => viewFeeDetailsDrawer.close()}>
            {translate('text_62f50d26c989ab03196884ae')}
          </Button>
        </div>
      ),
    })
  }

  useImperativeHandle(ref, () => ({
    openDrawer: openViewFeeDetailsDrawer,
    closeDrawer: () => viewFeeDetailsDrawer.close(),
  }))

  return null
})

ViewFeeDetailsDrawer.displayName = 'ViewFeeDetailsDrawer'
