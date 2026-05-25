import { Accordion } from '~/components/designSystem/Accordion'
import { Typography } from '~/components/designSystem/Typography'
import { SubscriptionFeeInfo } from '~/components/plans/SubscriptionFeeInfo'
import { EditPlanFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PlanDetailsSubscriptionFeeAccordion = ({
  plan,
}: {
  plan?: EditPlanFragment | null
}) => {
  const { translate } = useInternationalization()

  return (
    <Accordion
      summary={
        <Typography variant="bodyHl" color="grey700">
          {plan?.invoiceDisplayName || translate('text_642d5eb2783a2ad10d670336')}
        </Typography>
      }
    >
      <SubscriptionFeeInfo plan={plan ?? {}} />
    </Accordion>
  )
}
