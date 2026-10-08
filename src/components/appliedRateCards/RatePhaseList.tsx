import { Accordion } from '~/components/designSystem/Accordion'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { RatePhaseFormValues } from './drawers/ratePhase/ratePhaseFormSchema'
import { getOverriddenFields, OverrideDiffField } from './overrideDiff'

type LocalRatePhase = RatePhaseFormValues

type ActiveRateForDiff = Parameters<typeof getOverriddenFields>[0]

type RatePhaseForLinkedList = { id: string; code: string; name?: string | null }

type RatePhaseListProps =
  | {
      variant: 'accordion'
      phases: LocalRatePhase[]
      activeRate: ActiveRateForDiff
      onEdit: (index: number) => void
      onRemove: (index: number) => void
    }
  | {
      variant: 'linked'
      phases: RatePhaseForLinkedList[]
      getPhaseHref: (phase: RatePhaseForLinkedList) => string
    }

const overriddenFieldClassName = 'rounded bg-purple-100 border border-purple-200 px-2 py-1'

const renderOverridableField = (
  testIdSuffix: string,
  label: string,
  value: string,
  isOverridden: boolean,
): JSX.Element => (
  <div
    data-test={`rate-phase-field-${testIdSuffix}`}
    className={isOverridden ? overriddenFieldClassName : undefined}
  >
    <Typography variant="caption">{label}</Typography>
    <Typography variant="body">{value}</Typography>
  </div>
)

const AccordionRatePhaseList = ({
  phases,
  activeRate,
  onEdit,
  onRemove,
}: Extract<RatePhaseListProps, { variant: 'accordion' }>): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-2">
      {phases.map((phase, index) => {
        const overriddenFields: Set<OverrideDiffField> = phase.overrideEnabled
          ? getOverriddenFields(activeRate, {
              rateModel: phase.rateModel,
              rateProperties: phase.properties,
              billingIntervalCount: Number(phase.overrideBillingIntervalCount),
              billingIntervalUnit: phase.overrideBillingIntervalUnit,
              minAmountCents: Number(phase.minAmountCents),
              pricingUnitConversionRate: phase.conversionRate ? Number(phase.conversionRate) : null,
            })
          : new Set()

        return (
          <Accordion
            key={`${phase.code}-${index}`}
            summary={
              <div className="flex flex-1 items-center justify-between">
                <Typography variant="bodyHl">{phase.name || phase.code}</Typography>
                <div className="flex items-center gap-2">
                  <Button
                    data-test={`rate-phase-row-edit-${index}`}
                    variant="quaternary"
                    icon="pen"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit(index)
                    }}
                  />
                  <Button
                    data-test={`rate-phase-row-remove-${index}`}
                    variant="quaternary"
                    icon="trash"
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemove(index)
                    }}
                  />
                </div>
              </div>
            }
          >
            <div className="flex flex-col gap-2">
              {renderOverridableField(
                'rateModel',
                translate('text_65201b8216455901fe273dd5'),
                phase.rateModel,
                overriddenFields.has('rateModel'),
              )}
              {renderOverridableField(
                'rateProperties',
                translate('text_63ebba5f5160e26242c48bd2'),
                JSON.stringify(phase.properties),
                overriddenFields.has('rateProperties'),
              )}
            </div>
          </Accordion>
        )
      })}
    </div>
  )
}

const LinkedRatePhaseList = (): JSX.Element => <div />

export const RatePhaseList = (props: RatePhaseListProps): JSX.Element => {
  if (props.variant === 'linked') return <LinkedRatePhaseList />

  return <AccordionRatePhaseList {...props} />
}
