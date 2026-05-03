import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import {
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
} from '~/components/layouts/Settings'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { useEditOrganizationSlugDialog } from './dialogs/useEditOrganizationSlugDialog'

const OrganizationGeneralSettings = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { organization, loading } = useOrganizationInfos()
  const { openEditOrganizationSlugDialog } = useEditOrganizationSlugDialog()

  const canUpdate = hasPermissions(['organizationUpdate'])
  const currentSlug = organization?.slug || ''

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
        </SettingsListWrapper>
      </SettingsPaddedContainer>
    </>
  )
}

export default OrganizationGeneralSettings
