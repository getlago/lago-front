import { Icon } from 'lago-design-system'

import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { EditPlanFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type PlanDetailsPresentationGroupKeysProps = {
  charge: NonNullable<EditPlanFragment['charges']>[number]
}

const PlanDetailsPresentationGroupKeys = ({ charge }: PlanDetailsPresentationGroupKeysProps) => {
  const { translate } = useInternationalization()
  const presentationGroupKeys = charge.properties?.presentationGroupKeys

  if (!presentationGroupKeys?.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 pt-4">
      <Typography variant="caption">{translate('text_17774502138912d3etwcacpe')}</Typography>
      {presentationGroupKeys.map((key, index) => {
        const isOnInvoice = key.options?.displayInInvoice === true

        return (
          <div key={index} className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
            <div className="flex flex-row items-center gap-2">
              <Icon
                name={isOnInvoice ? 'validate-filled' : 'close-circle-filled'}
                color={isOnInvoice ? 'input' : 'disabled'}
                size="small"
              />
              <Typography variant="captionHl" color="grey700">
                {isOnInvoice
                  ? translate('text_1777456950225zgyccgcm3x4')
                  : translate('text_1777456950225qhho55pdxm8')}
              </Typography>
            </div>
            <Chip label={key.value} />
          </div>
        )
      })}
    </div>
  )
}

export default PlanDetailsPresentationGroupKeys
