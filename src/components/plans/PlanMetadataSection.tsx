import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { FC } from 'react'

import { MetadataFormSection } from '~/components/metadata/MetadataFormSection'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PlanFormType } from '~/hooks/plans/usePlanForm'

gql`
  fragment PlanMetadataForPlan on Plan {
    metadata {
      key
      value
    }
  }
`

interface PlanMetadataSectionProps {
  form: PlanFormType
}

export const PlanMetadataSection: FC<PlanMetadataSectionProps> = ({ form }) => {
  const { translate } = useInternationalization()
  const metadata = useStore(form.store, (s) => s.values.metadata)

  return (
    <MetadataFormSection
      metadata={metadata ?? []}
      description={translate('text_1784536360268d9fpetpsrej')}
      onChange={(nextMetadata) => form.setFieldValue('metadata', nextMetadata)}
    />
  )
}

PlanMetadataSection.displayName = 'PlanMetadataSection'
