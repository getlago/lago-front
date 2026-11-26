import { CenteredPage } from '~/components/layouts/CenteredPage'
import { MetadataRowsFieldGroup } from '~/components/metadata/MetadataRowsFieldGroup'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  DEFAULT_VALUES,
  ITEM_METADATA_KEY_MAX_LENGTH,
  ITEM_METADATA_VALUE_MAX_LENGTH,
  MAX_ITEM_METADATA_COUNT,
} from './constants'

export const ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID = 'add-item-metadata-drawer-row'

interface ItemMetadataDrawerContentExtraProps {
  // Owner-specific copy, e.g. "Store custom key-value pairs on this plan."
  description: string
}

const itemMetadataDrawerContentDefaultProps: ItemMetadataDrawerContentExtraProps = {
  description: '',
}

export const ItemMetadataDrawerContent = withForm({
  defaultValues: DEFAULT_VALUES,
  props: itemMetadataDrawerContentDefaultProps,
  render: function ItemMetadataDrawerContentRender({ form, description }) {
    const { translate } = useInternationalization()

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate('text_63fcc3218d35b9377840f59b')}
          description={description}
        />

        <CenteredPage.PageSection>
          <MetadataRowsFieldGroup
            form={form}
            fields={{ metadata: 'metadata' }}
            keyMaxLength={ITEM_METADATA_KEY_MAX_LENGTH}
            valueMaxLength={ITEM_METADATA_VALUE_MAX_LENGTH}
            maxCount={MAX_ITEM_METADATA_COUNT}
            keyColumnLabel={translate('text_63fcc3218d35b9377840f5a3')}
            valueColumnLabel={translate('text_63fcc3218d35b9377840f5ab')}
            addRowLabel={translate('text_6405cac5c833dcf18cad0196')}
            addRowDataTest={ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID}
            gridClassName="grid grid-cols-[200px_1fr_24px] gap-x-3 gap-y-6"
          />
        </CenteredPage.PageSection>
      </CenteredPage.SectionWrapper>
    )
  },
})
