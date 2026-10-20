import { Fragment, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'
import { tw } from '~/styles/utils'

import { RatePhaseFormValues } from './drawers/ratePhase/ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './drawers/ratePhase/types'
import { RatePhaseDetailsPanel } from './RatePhaseDetailsPanel'
import { RatePhaseForDetails } from './ratePhaseDisplay'
import { RatePhaseDurationChip } from './RatePhaseDurationChip'
import { getFormPhaseRate } from './ratePhaseRate'
import { RatePhaseRateChip } from './RatePhaseRateChip'

export const RATE_PHASE_TABLE_TEST_ID = 'rate-phase-table'
export const getRatePhaseToggleTestId = (index: number): string => `rate-phase-toggle-${index}`
export const getRatePhaseActionsTestId = (index: number): string => `rate-phase-actions-${index}`
export const RATE_PHASE_EDIT_ACTION_TEST_ID = 'rate-phase-edit-action'
export const RATE_PHASE_REVERT_ACTION_TEST_ID = 'rate-phase-revert-action'
export const RATE_PHASE_DELETE_ACTION_TEST_ID = 'rate-phase-delete-action'

type RatePhaseTableProps = {
  phases: RatePhaseFormValues[]
  rateCardId: string
  rateCard: RateCardForRatePhaseFields
  onEdit: (index: number) => void
  onRevert: (index: number) => void
  onDelete: (index: number) => void
}

const toPhaseForDetails = (phase: RatePhaseFormValues, index: number): RatePhaseForDetails => ({
  name: phase.name,
  code: phase.code,
  position: index + 1,
  billingIntervalCycleCount:
    phase.durationType === 'forever' ? null : Number(phase.durationCycleCount),
})

const CELL_CLASSNAME = 'flex items-center border-b border-grey-300 pl-1 pr-6'

export const RatePhaseTable = ({
  phases,
  rateCardId,
  rateCard,
  onEdit,
  onRevert,
  onDelete,
}: RatePhaseTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set())

  const toggleExpanded = (code: string): void =>
    setExpandedCodes((current) => {
      const next = new Set(current)

      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }

      return next
    })

  return (
    <div
      className="grid grid-cols-[32px_max-content_minmax(0,1fr)_max-content_max-content_56px]"
      data-test={RATE_PHASE_TABLE_TEST_ID}
    >
      <div className="h-10 border-b border-grey-300" />
      <div className={tw(CELL_CLASSNAME, 'h-10 justify-end')}>
        <Typography variant="captionHl" color="grey600">
          {translate('text_1791838459984bohwav05qa1')}
        </Typography>
      </div>
      <div className={tw(CELL_CLASSNAME, 'h-10')}>
        <Typography variant="captionHl" color="grey600">
          {translate('text_1790286678206xilydvk4a1n')}
        </Typography>
      </div>
      <div className={tw(CELL_CLASSNAME, 'h-10')}>
        <Typography variant="captionHl" color="grey600">
          {translate('text_632d68358f1fedc68eed3e80')}
        </Typography>
      </div>
      <div className={tw(CELL_CLASSNAME, 'h-10')}>
        <Typography variant="captionHl" color="grey600">
          {translate('text_64de472463e2da6b31737de0')}
        </Typography>
      </div>
      <div className="h-10 border-b border-grey-300" />

      {phases.map((phase, index) => {
        const isExpanded = expandedCodes.has(phase.code)
        const phaseForDetails = toPhaseForDetails(phase, index)
        const phaseRate = getFormPhaseRate(phase, rateCard)

        return (
          <Fragment key={phase.code}>
            <div className="flex items-center justify-end border-b border-grey-300 px-1 py-3">
              <Button
                variant="quaternary"
                size="small"
                icon="chevron-right-filled"
                className={tw('transition-transform', isExpanded && 'rotate-90')}
                data-test={getRatePhaseToggleTestId(index)}
                onClick={() => toggleExpanded(phase.code)}
              />
            </div>
            <div className={tw(CELL_CLASSNAME, 'justify-end py-3')}>
              <Typography variant="captionCode" color="grey600">
                {index + 1}
              </Typography>
            </div>
            <div className={tw(CELL_CLASSNAME, 'py-3')}>
              <Typography variant="body" color="grey700" noWrap>
                {phase.name || phase.code}
              </Typography>
            </div>
            <div className={tw(CELL_CLASSNAME, 'py-2')}>
              <RatePhaseDurationChip
                cycleCount={phaseForDetails.billingIntervalCycleCount}
                rate={phaseRate?.rate}
              />
            </div>
            <div className={tw(CELL_CLASSNAME, 'py-2')}>
              <RatePhaseRateChip isOverridden={phase.overrideEnabled} />
            </div>
            <div className="flex items-center border-b border-grey-300 py-1 pl-3 pr-1">
              <Popper
                PopperProps={{ placement: 'bottom-end' }}
                opener={
                  <Button
                    variant="quaternary"
                    icon="dots-horizontal"
                    data-test={getRatePhaseActionsTestId(index)}
                  />
                }
              >
                {({ closePopper }) => (
                  <MenuPopper>
                    <Button
                      variant="quaternary"
                      startIcon="pen"
                      align="left"
                      data-test={RATE_PHASE_EDIT_ACTION_TEST_ID}
                      onClick={() => {
                        onEdit(index)
                        closePopper()
                      }}
                    >
                      {translate('text_1791485670326gf0h0n6l1w7')}
                    </Button>
                    {phase.overrideEnabled && (
                      <Button
                        variant="quaternary"
                        startIcon="reset"
                        align="left"
                        data-test={RATE_PHASE_REVERT_ACTION_TEST_ID}
                        onClick={() => {
                          onRevert(index)
                          closePopper()
                        }}
                      >
                        {translate('text_17918384599838l5yv3p0tod')}
                      </Button>
                    )}
                    <Button
                      variant="quaternary"
                      startIcon="trash"
                      align="left"
                      data-test={RATE_PHASE_DELETE_ACTION_TEST_ID}
                      onClick={() => {
                        onDelete(index)
                        closePopper()
                      }}
                    >
                      {translate('text_1791838459984x6zh06klebn')}
                    </Button>
                  </MenuPopper>
                )}
              </Popper>
            </div>

            {isExpanded && (
              <div className="col-span-full">
                <RatePhaseDetailsPanel
                  phase={phaseForDetails}
                  phaseRate={phaseRate}
                  rateCardId={rateCardId}
                  rateCard={rateCard}
                />
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
