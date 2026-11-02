import { ReactNode } from 'react'

import { RateCardForRatePhaseFields } from '~/components/appliedRateCards/drawers/ratePhase/types'
import { formatRatePhaseName, RatePhaseRate } from '~/components/appliedRateCards/ratePhaseDisplay'
import { RatePhaseDurationChip } from '~/components/appliedRateCards/RatePhaseDurationChip'
import { getServerPhaseRate } from '~/components/appliedRateCards/ratePhaseRate'
import { RatePhaseRateChip } from '~/components/appliedRateCards/RatePhaseRateChip'
import { PaginatedContent } from '~/components/designSystem/Pagination/PaginatedContent'
import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { ActionColumn } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { RatePhaseForDrawerFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import type { RatePhaseAction } from './useRatePhaseActions'

export const APPLIED_RATE_CARD_PHASES_TABLE_TEST_ID = 'applied-rate-card-phases-table'
export const APPLIED_RATE_CARD_PHASE_POSITION_TEST_ID = 'applied-rate-card-phase-position'
export const APPLIED_RATE_CARD_PHASE_NAME_TEST_ID = 'applied-rate-card-phase-name'
export const APPLIED_RATE_CARD_PHASE_RATE_EMPTY_TEST_ID = 'applied-rate-card-phase-rate-empty'
export const getAppliedRateCardPhaseRowTestId = (position: number): string =>
  `applied-rate-card-phase-row-${position}`

export const APPLIED_RATE_CARD_PHASES_PAGE_SIZE = 20

type AppliedRateCardPhasesTableProps = {
  phases: RatePhaseForDrawerFragment[]
  rateCard: RateCardForRatePhaseFields | undefined
  getPhaseHref: (phase: RatePhaseForDrawerFragment) => string
  getPhaseActions: (phase: RatePhaseForDrawerFragment) => RatePhaseAction[]
}

export const AppliedRateCardPhasesTable = ({
  phases,
  rateCard,
  getPhaseHref,
  getPhaseActions,
}: AppliedRateCardPhasesTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { page: currentPage, goToPage } = usePageSearchParam()

  const totalPages = Math.ceil(phases.length / APPLIED_RATE_CARD_PHASES_PAGE_SIZE)
  const firstRowIndex = (currentPage - 1) * APPLIED_RATE_CARD_PHASES_PAGE_SIZE
  const pagePhases = phases.slice(firstRowIndex, firstRowIndex + APPLIED_RATE_CARD_PHASES_PAGE_SIZE)
  const metadata = { currentPage, totalPages, totalCount: phases.length }

  const phaseRates = new Map(
    pagePhases.map((phase) => [phase.id, rateCard ? getServerPhaseRate(phase, rateCard) : null]),
  )
  const getPhaseRate = (phase: RatePhaseForDrawerFragment): RatePhaseRate | null =>
    phaseRates.get(phase.id) ?? null

  const renderRate = (phase: RatePhaseForDrawerFragment): ReactNode => {
    const phaseRate = getPhaseRate(phase)

    if (!phaseRate) {
      return (
        <Typography
          variant="body"
          color="grey600"
          data-test={APPLIED_RATE_CARD_PHASE_RATE_EMPTY_TEST_ID}
        >
          -
        </Typography>
      )
    }

    return <RatePhaseRateChip isOverridden={phaseRate.isOverridden} />
  }

  const columns: Array<TableColumn<RatePhaseForDrawerFragment>> = [
    {
      key: 'position',
      title: translate('text_1791838459984bohwav05qa1'),
      textAlign: 'right',
      minWidth: 37,
      content: (phase) => (
        <Typography
          variant="captionCode"
          color="grey600"
          data-test={APPLIED_RATE_CARD_PHASE_POSITION_TEST_ID}
        >
          {phase.position}
        </Typography>
      ),
    },
    {
      key: 'name',
      title: translate('text_1790286678206xilydvk4a1n'),
      minWidth: 240,
      maxSpace: true,
      content: (phase) => (
        <Typography
          variant="body"
          color="grey700"
          noWrap
          data-test={APPLIED_RATE_CARD_PHASE_NAME_TEST_ID}
        >
          {formatRatePhaseName(phase, translate)}
        </Typography>
      ),
    },
    {
      key: 'billingIntervalCycleCount',
      title: translate('text_632d68358f1fedc68eed3e80'),
      minWidth: 94,
      content: (phase) => (
        <RatePhaseDurationChip
          cycleCount={phase.billingIntervalCycleCount ?? null}
          rate={getPhaseRate(phase)?.rate}
        />
      ),
    },
    {
      key: 'rateOverride',
      title: translate('text_64de472463e2da6b31737de0'),
      minWidth: 115,
      content: renderRate,
    },
  ]

  const actionColumn: ActionColumn<RatePhaseForDrawerFragment> = (phase) =>
    getPhaseActions(phase).map(({ label, startIcon, disabled, dataTest, onAction }) => ({
      title: label,
      startIcon,
      disabled,
      dataTest,
      onAction,
    }))

  return (
    <div data-test={APPLIED_RATE_CARD_PHASES_TABLE_TEST_ID}>
      <PaginatedContent
        metadata={metadata}
        onPageChange={goToPage}
        pageSize={APPLIED_RATE_CARD_PHASES_PAGE_SIZE}
        sticky={false}
      >
        <Table
          name="applied-rate-card-phases"
          data={pagePhases}
          columns={columns}
          containerSize={0}
          containerClassName="h-auto shrink-0 overflow-visible [-webkit-transform:none] -mb-px border-t border-grey-300"
          hideLastRowBorder
          onRowActionLink={getPhaseHref}
          rowLinkLabel={(phase) => formatRatePhaseName(phase, translate)}
          rowDataTestId={(phase) => getAppliedRateCardPhaseRowTestId(phase.position)}
          actionColumn={actionColumn}
        />
      </PaginatedContent>
    </div>
  )
}
