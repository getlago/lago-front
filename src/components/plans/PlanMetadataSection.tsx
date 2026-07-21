import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { FC, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  ItemMetadataDrawer,
  ItemMetadataDrawerRef,
  ItemMetadataFormValues,
} from '~/components/metadata/ItemMetadataDrawer'
import { MetadataInfo } from '~/components/metadata/MetadataInfo'
import { SectionAccordion } from '~/components/plans/details-v2/shared/SectionAccordion'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PlanFormType } from '~/hooks/plans/usePlanForm'

export const ADD_PLAN_METADATA_TEST_ID = 'add-plan-metadata'
export const PLAN_METADATA_ACCORDION_TEST_ID = 'plan-metadata-accordion'

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
  const planMetadataDrawerRef = useRef<ItemMetadataDrawerRef>(null)

  const metadata = useStore(form.store, (s) => s.values.metadata)
  const hasMetadata = !!metadata?.length

  const currentDrawerValues = () => ({
    metadata: (metadata || []).map(({ key, value }) => ({ key, value: value || '' })),
  })

  // "Add" opens with a ready-to-type empty row appended; "Edit" opens as-is.
  const openAddMetadataDrawer = () => {
    planMetadataDrawerRef.current?.openDrawer(currentDrawerValues(), { appendEmptyRow: true })
  }

  const openEditMetadataDrawer = () => {
    planMetadataDrawerRef.current?.openDrawer(currentDrawerValues())
  }

  const handleDrawerSave = (values: ItemMetadataFormValues) => {
    form.setFieldValue('metadata', values.metadata)
  }

  return (
    <CenteredPage.PageSection>
      {hasMetadata ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <Typography variant="subhead1" color="grey700">
              {translate('text_63fcc3218d35b9377840f59b')}
            </Typography>
            <Button
              fitContent
              variant="inline"
              startIcon="plus"
              data-test={ADD_PLAN_METADATA_TEST_ID}
              onClick={openAddMetadataDrawer}
            >
              {translate('text_6405cac5c833dcf18cad0196')}
            </Button>
          </div>
          <Typography variant="caption" color="grey600">
            {translate('text_1784536360268d9fpetpsrej')}
          </Typography>
        </div>
      ) : (
        <CenteredPage.PageSectionTitle
          title={translate('text_63fcc3218d35b9377840f59b')}
          description={translate('text_1784536360268d9fpetpsrej')}
        />
      )}

      {hasMetadata && (
        <SectionAccordion
          icon="brackets"
          title={translate('text_63fcc3218d35b9377840f59b')}
          noContentMargin
          dataTest={PLAN_METADATA_ACCORDION_TEST_ID}
          actions={[
            {
              label: translate('text_63e51ef4985f0ebd75c212fc'),
              startIcon: 'pen',
              onClick: () => openEditMetadataDrawer(),
            },
            {
              label: translate('text_1784637373017e1som6d92em'),
              startIcon: 'trash',
              onClick: () => form.setFieldValue('metadata', []),
            },
          ]}
        >
          <MetadataInfo metadata={metadata ?? []} />
        </SectionAccordion>
      )}

      {!hasMetadata && (
        <Button
          fitContent
          variant="inline"
          startIcon="plus"
          data-test={ADD_PLAN_METADATA_TEST_ID}
          onClick={openAddMetadataDrawer}
        >
          {translate('text_6405cac5c833dcf18cad0196')}
        </Button>
      )}

      <ItemMetadataDrawer
        ref={planMetadataDrawerRef}
        description={translate('text_1784536360268d9fpetpsrej')}
        onSave={handleDrawerSave}
        onDelete={() => form.setFieldValue('metadata', [])}
      />
    </CenteredPage.PageSection>
  )
}

PlanMetadataSection.displayName = 'PlanMetadataSection'
