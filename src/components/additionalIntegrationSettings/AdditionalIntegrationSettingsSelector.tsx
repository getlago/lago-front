import {
  ConnectionBehavior,
  deriveConnectionBehavior,
} from '~/components/connectionSelection/types'
import { CONNECTION_CATEGORY_SHORT_LABEL_KEYS } from '~/components/customerConnections/types'
import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  ADDITIONAL_INTEGRATION_CATEGORIES,
  AdditionalIntegrationSettingsValues,
} from './additionalIntegrationSettingsSchema'
import { useAdditionalIntegrationSettingsDrawer } from './useAdditionalIntegrationSettingsDrawer'

export const ADDITIONAL_INTEGRATION_SETTINGS_SELECTOR_TEST_ID =
  'additional-integration-settings-selector'

export const ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR: Record<ConnectionBehavior, string> = {
  [ConnectionBehavior.INHERIT]: 'text_17894845850934kgklcyl5dz',
  [ConnectionBehavior.SPECIFIC]: 'text_17893745905100lz4yq92hs3',
  [ConnectionBehavior.SKIP]: 'text_1789472252793x3dxbqu3x10',
}

interface AdditionalIntegrationSettingsSelectorProps {
  customerId: string
  values: AdditionalIntegrationSettingsValues
  onChange: (values: AdditionalIntegrationSettingsValues) => void
  'data-test'?: string
}

export const AdditionalIntegrationSettingsSelector = ({
  customerId,
  values,
  onChange,
  'data-test': dataTest = ADDITIONAL_INTEGRATION_SETTINGS_SELECTOR_TEST_ID,
}: AdditionalIntegrationSettingsSelectorProps) => {
  const { translate } = useInternationalization()
  const { openDrawer } = useAdditionalIntegrationSettingsDrawer({
    customerId,
    onSave: onChange,
  })

  const getSubtitle = (): string => {
    const segments = ADDITIONAL_INTEGRATION_CATEGORIES.reduce<string[]>((acc, category) => {
      const behavior = deriveConnectionBehavior(values[category])

      if (behavior === ConnectionBehavior.INHERIT) return acc

      return [
        ...acc,
        `${translate(CONNECTION_CATEGORY_SHORT_LABEL_KEYS[category])}: ${translate(ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR[behavior])}`,
      ]
    }, [])

    if (!segments.length) {
      return translate(ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR[ConnectionBehavior.INHERIT])
    }

    return segments.join(' • ')
  }

  return (
    <Selector
      icon="plug"
      title={translate('text_1789484166778dwpk49ynwbz')}
      subtitle={getSubtitle()}
      endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
      onClick={() => openDrawer(values)}
      data-test={dataTest}
    />
  )
}
