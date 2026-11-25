import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { FC } from 'react'

import {
  MetadataFormSection,
  metadataFormSectionTestIds,
} from '~/components/metadata/MetadataFormSection'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PlanFormType } from '~/hooks/plans/usePlanForm'

const PLAN_METADATA_TEST_ID = 'plan-metadata'

export const ADD_PLAN_METADATA_TEST_ID = metadataFormSectionTestIds(PLAN_METADATA_TEST_ID).add
export const PLAN_METADATA_ACCORDION_TEST_ID =
  metadataFormSectionTestIds(PLAN_METADATA_TEST_ID).accordion

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
      dataTest={PLAN_METADATA_TEST_ID}
      onChange={(nextMetadata) => form.setFieldValue('metadata', nextMetadata)}
    />
  )
}

PlanMetadataSection.displayName = 'PlanMetadataSection'
