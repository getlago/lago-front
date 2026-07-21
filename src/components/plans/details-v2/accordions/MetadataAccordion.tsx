import { useRef } from 'react'

import {
  ItemMetadataDrawer,
  ItemMetadataDrawerRef,
  ItemMetadataFormValues,
} from '~/components/metadata/ItemMetadataDrawer'
import { MetadataInfo } from '~/components/metadata/MetadataInfo'
import { PlanDetailsV2Fragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAccordionPermissions } from '~/hooks/plans/useAccordionPermissions'
import { useUpdatePlanWithCascade } from '~/hooks/plans/useUpdatePlanWithCascade'

import { SectionAccordion } from '../shared/SectionAccordion'
import { SectionHeader } from '../shared/SectionHeader'
import { PlanDetailsV2SectionId } from '../sidebarSections'

type MetadataAccordionProps = {
  plan: PlanDetailsV2Fragment
  isInSubscriptionForm?: boolean
}

export const MetadataAccordion = ({
  plan,
  isInSubscriptionForm = false,
}: MetadataAccordionProps) => {
  const { translate } = useInternationalization()
  const { canCreate, canUpdate, canDelete } = useAccordionPermissions(isInSubscriptionForm)
  const drawerRef = useRef<ItemMetadataDrawerRef>(null)

  const metadata = plan.metadata ?? []
  const hasMetadata = metadata.length > 0

  // Always open with the existing pairs: the drawer edits the whole metadata
  // map, so an empty start would overwrite the pre-existing entries on save.
  const openDrawer = () =>
    drawerRef.current?.openDrawer({
      metadata: metadata.map(({ key, value }) => ({ key, value: value || '' })),
    })

  const { form, applyAndSubmit } = useUpdatePlanWithCascade({
    plan,
    includeAdvancedFields: true,
  })

  const handleSave = (values: ItemMetadataFormValues): Promise<boolean> =>
    applyAndSubmit(() => form.setFieldValue('metadata', values.metadata))

  const handleDelete = (): Promise<boolean> =>
    applyAndSubmit(() => form.setFieldValue('metadata', []))

  return (
    <section id={PlanDetailsV2SectionId.Metadata} className="flex scroll-mt-12 flex-col gap-6">
      <SectionHeader
        title={translate('text_63fcc3218d35b9377840f59b')}
        description={translate('text_1784536360268d9fpetpsrej')}
        action={{
          label: translate('text_6405cac5c833dcf18cad0196'),
          onClick: () => openDrawer(),
          hidden: !canCreate,
          startIcon: 'plus',
        }}
      />

      {hasMetadata && (
        <SectionAccordion
          icon="brackets"
          title={translate('text_63fcc3218d35b9377840f59b')}
          noContentMargin
          actions={[
            {
              label: translate('text_63e51ef4985f0ebd75c212fc'),
              startIcon: 'pen',
              onClick: () => openDrawer(),
              hidden: !canUpdate,
            },
            {
              label: translate('text_63ea0f84f400488553caa786'),
              startIcon: 'trash',
              onClick: () => void handleDelete(),
              hidden: !canDelete,
            },
          ]}
        >
          <MetadataInfo metadata={metadata} />
        </SectionAccordion>
      )}

      <ItemMetadataDrawer
        ref={drawerRef}
        description={translate('text_1784536360268d9fpetpsrej')}
        onSave={handleSave}
        onDelete={() => void handleDelete()}
      />
    </section>
  )
}
