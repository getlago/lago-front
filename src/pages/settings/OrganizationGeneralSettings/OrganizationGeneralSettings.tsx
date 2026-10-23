import { gql } from '@apollo/client'
import { useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import {
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
} from '~/components/layouts/Settings'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { CUSTOMER_PORTAL_EDITABLE_FIELDS } from '~/core/constants/customerPortalEditableFields'
import { useGetOrganizationCustomerPortalSettingsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useEditCustomerPortalFieldsDialog } from './dialogs/useEditCustomerPortalFieldsDialog'
import { useEditOrganizationSlugDialog } from './dialogs/useEditOrganizationSlugDialog'

gql`
  query getOrganizationCustomerPortalSettings {
    organization {
      id
      customerPortalEditableFields
    }
  }
`

const OrganizationGeneralSettings = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openEditOrganizationSlugDialog } = useEditOrganizationSlugDialog()
  const { openEditCustomerPortalFieldsDialog } = useEditCustomerPortalFieldsDialog()
  const { data: customerPortalSettingsData, loading: customerPortalSettingsLoading } =
    useGetOrganizationCustomerPortalSettingsQuery()

  const { organizationSlug } = useParams<{ organizationSlug: string }>()

  const canUpdate = hasPermissions(['organizationUpdate'])
  const currentSlug = organizationSlug || ''
  const loading = !currentSlug

  // Editing these fields decides who sets the tax inputs, so it follows the taxes permission
  const canUpdateCustomerPortalFields = hasPermissions(['organizationTaxesUpdate'])
  const customerPortalEditableFields =
    customerPortalSettingsData?.organization?.customerPortalEditableFields ?? []
  const customerPortalEditableFieldLabels = CUSTOMER_PORTAL_EDITABLE_FIELDS.filter(({ field }) =>
    customerPortalEditableFields.includes(field),
  ).map(({ labelKey }) => translate(labelKey))

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: translate('text_1776867582729i8hvt0ot0wl'),
          metadata: translate('text_1776867582729flunw00muqy'),
        }}
      />

      <SettingsPaddedContainer>
        <SettingsListWrapper>
          {loading && <SettingsListItemLoadingSkeleton count={1} />}

          {!loading && (
            <div className="flex flex-col gap-4 pb-12 shadow-b">
              <SettingsListItemHeader
                label={translate('text_1776867582729ra096lnt5hc')}
                sublabel={translate('text_1776867582729aiet5qqthjk')}
                action={
                  canUpdate ? (
                    <Button
                      variant="inline"
                      disabled={!currentSlug}
                      onClick={() =>
                        openEditOrganizationSlugDialog({
                          currentSlug,
                        })
                      }
                      data-test="edit-organization-slug-button"
                    >
                      {translate('text_1776867582730ouvncumhk7p')}
                    </Button>
                  ) : undefined
                }
              />

              <Typography
                variant="body"
                color="grey700"
                className="font-mono"
                data-test="current-organization-slug"
              >
                {currentSlug ? `/${currentSlug}` : '—'}
              </Typography>
            </div>
          )}

          {customerPortalSettingsLoading && <SettingsListItemLoadingSkeleton count={1} />}

          {!customerPortalSettingsLoading && (
            <div className="flex flex-col gap-4 pb-12 shadow-b">
              <SettingsListItemHeader
                label={translate('text_17927135765711akh2267o9f')}
                sublabel={translate('text_1792713576572546stva6wu6')}
                action={
                  canUpdateCustomerPortalFields ? (
                    <Button
                      variant="inline"
                      onClick={() =>
                        openEditCustomerPortalFieldsDialog({
                          editableFields: customerPortalEditableFields,
                        })
                      }
                      data-test="edit-customer-portal-fields-button"
                    >
                      {translate('text_1776867582730ouvncumhk7p')}
                    </Button>
                  ) : undefined
                }
              />

              <Typography
                variant="body"
                color="grey700"
                data-test="customer-portal-editable-fields"
              >
                {customerPortalEditableFieldLabels.length
                  ? customerPortalEditableFieldLabels.join(', ')
                  : translate('text_17927135765776z05d5xcetc')}
              </Typography>
            </div>
          )}
        </SettingsListWrapper>
      </SettingsPaddedContainer>
    </>
  )
}

export default OrganizationGeneralSettings
