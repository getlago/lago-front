import { gql } from '@apollo/client'
import { useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import {
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
} from '~/components/layouts/Settings'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { CUSTOMER_PORTAL_FORM_FIELDS } from '~/core/constants/customerPortalEditableFields'
import { useGetOrganizationCustomerPortalSettingsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'

import { useEditCustomerPortalFieldsDialog } from './dialogs/useEditCustomerPortalFieldsDialog'
import { useEditOrganizationSlugDialog } from './dialogs/useEditOrganizationSlugDialog'

export const CUSTOMER_PORTAL_EDITABLE_FIELDS_TEST_ID = 'customer-portal-editable-fields'
export const CUSTOMER_PORTAL_NO_EDITABLE_FIELDS_TEST_ID = 'customer-portal-no-editable-fields'
export const CUSTOMER_PORTAL_SETTINGS_ERROR_TEST_ID = 'customer-portal-settings-error'
export const EDIT_CUSTOMER_PORTAL_FIELDS_BUTTON_TEST_ID = 'edit-customer-portal-fields-button'

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
  const {
    data: customerPortalSettingsData,
    loading: customerPortalSettingsLoading,
    error: customerPortalSettingsError,
  } = useGetOrganizationCustomerPortalSettingsQuery()

  const { organizationSlug } = useParams<{ organizationSlug: string }>()

  const canUpdate = hasPermissions(['organizationUpdate'])
  const currentSlug = organizationSlug || ''
  const loading = !currentSlug

  // Editing these fields decides who sets the tax inputs, so the taxes permission is needed on top of the organization one
  const canUpdateCustomerPortalFields = hasPermissions([
    'organizationUpdate',
    'organizationTaxesUpdate',
  ])
  const customerPortalOrganization = customerPortalSettingsData?.organization
  // Without the loaded list, the section must not look like "nothing is editable" nor let an empty list be saved
  const hasCustomerPortalSettingsError =
    !customerPortalSettingsLoading && (!!customerPortalSettingsError || !customerPortalOrganization)
  const customerPortalEditableFields =
    customerPortalOrganization?.customerPortalEditableFields ?? []
  const customerPortalEditableFieldLabels = CUSTOMER_PORTAL_FORM_FIELDS.filter(({ field }) =>
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

          {hasCustomerPortalSettingsError && (
            <div data-test={CUSTOMER_PORTAL_SETTINGS_ERROR_TEST_ID}>
              <GenericPlaceholder
                title={translate('text_629728388c4d2300e2d380d5')}
                subtitle={translate('text_629728388c4d2300e2d380eb')}
                buttonTitle={translate('text_629728388c4d2300e2d38110')}
                buttonVariant="primary"
                buttonAction={() => location.reload()}
                image={<ErrorImage width="136" height="104" />}
              />
            </div>
          )}

          {!customerPortalSettingsLoading && !hasCustomerPortalSettingsError && (
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
                      data-test={EDIT_CUSTOMER_PORTAL_FIELDS_BUTTON_TEST_ID}
                    >
                      {translate('text_1776867582730ouvncumhk7p')}
                    </Button>
                  ) : undefined
                }
              />

              {customerPortalEditableFieldLabels.length ? (
                <Typography
                  variant="body"
                  color="grey700"
                  data-test={CUSTOMER_PORTAL_EDITABLE_FIELDS_TEST_ID}
                >
                  {customerPortalEditableFieldLabels.join(', ')}
                </Typography>
              ) : (
                <Typography
                  variant="body"
                  color="grey700"
                  data-test={CUSTOMER_PORTAL_NO_EDITABLE_FIELDS_TEST_ID}
                >
                  {translate('text_17927135765776z05d5xcetc')}
                </Typography>
              )}
            </div>
          )}
        </SettingsListWrapper>
      </SettingsPaddedContainer>
    </>
  )
}

export default OrganizationGeneralSettings
