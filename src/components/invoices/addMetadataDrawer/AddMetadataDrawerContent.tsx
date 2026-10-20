import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { MetadataRowsFieldGroup } from '~/components/metadata/MetadataRowsFieldGroup'
import { METADATA_KEY_MAX_LENGTH } from '~/formValidation/metadataSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { DEFAULT_VALUES, MAX_METADATA_COUNT, METADATA_VALUE_MAX_LENGTH } from './constants'

export const ADD_METADATA_DRAWER_ADD_ROW_TEST_ID = 'add-metadata-drawer-row'

type AddMetadataDrawerContentExtraProps = {
  isEdition: boolean
}

const addMetadataDrawerContentDefaultProps: AddMetadataDrawerContentExtraProps = {
  isEdition: false,
}

export const AddMetadataDrawerContent = withForm({
  defaultValues: DEFAULT_VALUES,
  props: addMetadataDrawerContentDefaultProps,
  render: function AddMetadataDrawerContentRender({ form, isEdition }) {
    const { translate } = useInternationalization()

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate(
            isEdition ? 'text_6405cac5c833dcf18cacff6c' : 'text_6405cac5c833dcf18cacff32',
          )}
          description={translate('text_6405cac5c833dcf18cacff38')}
        />

        <CenteredPage.PageSection>
          <Typography variant="subhead1" color="grey700">
            {translate('text_6405cac5c833dcf18cacff3e')}
          </Typography>

          <MetadataRowsFieldGroup
            form={form}
            fields={{ metadata: 'metadata' }}
            keyMaxLength={METADATA_KEY_MAX_LENGTH}
            valueMaxLength={METADATA_VALUE_MAX_LENGTH}
            maxCount={MAX_METADATA_COUNT}
            keyColumnLabel={translate('text_6405cac5c833dcf18cacff66')}
            valueColumnLabel={translate('text_6405cac5c833dcf18cacff7c')}
            addRowLabel={translate('text_6405cac5c833dcf18cacff44')}
            addRowDataTest={ADD_METADATA_DRAWER_ADD_ROW_TEST_ID}
            gridClassName="grid grid-cols-[200px_1fr_24px] gap-x-6 gap-y-3"
          />
        </CenteredPage.PageSection>
      </CenteredPage.SectionWrapper>
    )
  },
})
