import { useStore } from '@tanstack/react-form'

import { CenteredPage } from '~/components/layouts/CenteredPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  ADDITIONAL_INTEGRATION_CATEGORIES,
  ADDITIONAL_INTEGRATION_SETTINGS_DEFAULT_VALUES,
} from './additionalIntegrationSettingsSchema'
import { AdditionalIntegrationSettingsSection } from './AdditionalIntegrationSettingsSection'

interface AdditionalIntegrationSettingsDrawerContentExtraProps {
  customerId: string
}

const contentDefaultProps: AdditionalIntegrationSettingsDrawerContentExtraProps = {
  customerId: '',
}

export const AdditionalIntegrationSettingsDrawerContent = withForm({
  defaultValues: ADDITIONAL_INTEGRATION_SETTINGS_DEFAULT_VALUES,
  props: contentDefaultProps,
  render: function AdditionalIntegrationSettingsDrawerContentRender({ form, customerId }) {
    const { translate } = useInternationalization()

    const values = useStore(form.store, (s) => s.values)
    const fieldMeta = useStore(form.store, (s) => s.fieldMeta)

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate('text_1789472252793twqbda38ec2')}
          description={translate('text_1789472252793x4lfuqim3a1')}
        />

        {ADDITIONAL_INTEGRATION_CATEGORIES.map((category) => {
          const errorKey = fieldMeta[category]?.errors?.[0]?.message

          return (
            <AdditionalIntegrationSettingsSection
              key={category}
              category={category}
              customerId={customerId}
              value={values[category]}
              onChange={(value) => form.setFieldValue(category, value)}
              error={errorKey ? translate(errorKey) : undefined}
            />
          )
        })}
      </CenteredPage.SectionWrapper>
    )
  },
})
