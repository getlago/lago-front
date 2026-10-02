import { useId } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type PricingGroupKeysDetailsProps = {
  pricingGroupKeys: string[] | null | undefined
}

export const PricingGroupKeysDetails = ({
  pricingGroupKeys,
}: PricingGroupKeysDetailsProps): JSX.Element | null => {
  const componentId = useId()
  const { translate } = useInternationalization()

  if (!pricingGroupKeys?.length) return null

  return (
    <DetailsPage.InfoGridItem
      label={translate('text_65ba6d45e780c1ff8acb20ce')}
      value={
        <div className="mt-1 flex flex-wrap gap-2">
          {pricingGroupKeys.map((group, groupIndex) => (
            <Chip key={`${componentId}-pricing-group-key-${groupIndex}`} label={group} />
          ))}
        </div>
      }
    />
  )
}
