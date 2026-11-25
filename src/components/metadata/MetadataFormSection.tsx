import { useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { SectionAccordion } from '~/components/plans/details-v2/shared/SectionAccordion'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  ItemMetadataDrawer,
  ItemMetadataDrawerRef,
  ItemMetadataFormValues,
} from './ItemMetadataDrawer'
import { MetadataInfo } from './MetadataInfo'
import { useDeleteAllMetadataDialog } from './useDeleteAllMetadataDialog'

export const ADD_METADATA_TEST_ID = 'add-metadata'
export const METADATA_ACCORDION_TEST_ID = 'metadata-accordion'

type MetadataFormSectionProps = {
  metadata: Array<{ key: string; value?: string | null }>
  description: string
  onChange: (metadata: ItemMetadataFormValues['metadata']) => void
}

export const MetadataFormSection = ({
  metadata,
  description,
  onChange,
}: MetadataFormSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { openDeleteAllMetadataDialog } = useDeleteAllMetadataDialog()
  const metadataDrawerRef = useRef<ItemMetadataDrawerRef>(null)

  const hasMetadata = metadata.length > 0

  const currentDrawerValues = (): ItemMetadataFormValues => ({
    metadata: metadata.map(({ key, value }) => ({ key, value: value || '' })),
  })

  const openAddMetadataDrawer = (): void => {
    metadataDrawerRef.current?.openDrawer(currentDrawerValues(), { appendEmptyRow: true })
  }

  const openEditMetadataDrawer = (): void => {
    metadataDrawerRef.current?.openDrawer(currentDrawerValues())
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
              data-test={ADD_METADATA_TEST_ID}
              onClick={openAddMetadataDrawer}
            >
              {translate('text_6405cac5c833dcf18cad0196')}
            </Button>
          </div>
          <Typography variant="caption" color="grey600">
            {description}
          </Typography>
        </div>
      ) : (
        <CenteredPage.PageSectionTitle
          title={translate('text_63fcc3218d35b9377840f59b')}
          description={description}
        />
      )}

      {hasMetadata && (
        <SectionAccordion
          icon="brackets"
          title={translate('text_63fcc3218d35b9377840f59b')}
          noContentMargin
          dataTest={METADATA_ACCORDION_TEST_ID}
          actions={[
            {
              label: translate('text_63e51ef4985f0ebd75c212fc'),
              startIcon: 'pen',
              onClick: () => openEditMetadataDrawer(),
            },
            {
              label: translate('text_1784637373017e1som6d92em'),
              startIcon: 'trash',
              onClick: () => openDeleteAllMetadataDialog({ onConfirm: () => onChange([]) }),
            },
          ]}
        >
          <MetadataInfo metadata={metadata} />
        </SectionAccordion>
      )}

      {!hasMetadata && (
        <Button
          fitContent
          variant="inline"
          startIcon="plus"
          data-test={ADD_METADATA_TEST_ID}
          onClick={openAddMetadataDrawer}
        >
          {translate('text_6405cac5c833dcf18cad0196')}
        </Button>
      )}

      <ItemMetadataDrawer
        ref={metadataDrawerRef}
        description={description}
        onSave={(values) => onChange(values.metadata)}
        onDelete={() => onChange([])}
      />
    </CenteredPage.PageSection>
  )
}
