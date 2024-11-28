import { gql } from '@apollo/client'
import { useRef } from 'react'

import { Avatar, Button, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/Pages'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  EditOrganizationInformationsDialog,
  EditOrganizationInformationsDialogRef,
} from '~/components/settings/EditOrganizationInformationsDialog'
import {
  EditOrganizationTimezoneDialog,
  EditOrganizationTimezoneDialogRef,
} from '~/components/settings/EditOrganizationTimezoneDialog'
import { CountryCodes } from '~/core/constants/countryCodes'
import { getTimezoneConfig } from '~/core/timezone'
import {
  EditOrganizationInformationsDialogFragment,
  EditOrganizationInformationsDialogFragmentDoc,
  TimezoneEnum,
  useGetOrganizationInformationsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  fragment OrganizationInformations on CurrentOrganization {
    id
    logoUrl
    name
    legalName
    legalNumber
    taxIdentificationNumber
    email
    addressLine1
    addressLine2
    zipcode
    city
    state
    country
    timezone
  }

  query getOrganizationInformations {
    organization {
      id
      ...OrganizationInformations
      ...EditOrganizationInformationsDialog
    }
  }
  ${EditOrganizationInformationsDialogFragmentDoc}
`

const OrganizationInformations = () => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const editInfosDialogRef = useRef<EditOrganizationInformationsDialogRef>(null)
  const editTimezoneDialogRef = useRef<EditOrganizationTimezoneDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { data, loading, error } = useGetOrganizationInformationsQuery()
  const {
    logoUrl,
    name,
    legalName,
    legalNumber,
    taxIdentificationNumber,
    email,
    addressLine1,
    addressLine2,
    zipcode,
    city,
    state,
    country,
    timezone,
  } = data?.organization || {}
  const timezoneConfig = getTimezoneConfig(timezone)

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_62bb102b66ff57dbfe7905c0')}
        subtitle={translate('text_62bb102b66ff57dbfe7905c2')}
        buttonTitle={translate('text_62bb102b66ff57dbfe7905c4')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }
  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_62ab2d0396dd6b0361614d2c')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_62ab2d0396dd6b0361614d2c')}</Typography>
          <Typography>{translate('text_6380d7e60f081e5b777c4b22')}</Typography>
        </SettingsPageHeaderContainer>

        <SettingsListWrapper>
          {!!loading ? (
            <SettingsListItemLoadingSkeleton count={2} />
          ) : (
            <>
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_638906e7b4f1a919cb61d0f4')}
                  sublabel={translate('text_17279506108559c3u84iznh2')}
                  action={
                    <>
                      {hasPermissions(['organizationUpdate']) && (
                        <Button
                          variant="quaternary"
                          endIcon={isPremium ? undefined : 'sparkles'}
                          onClick={() => {
                            isPremium
                              ? editTimezoneDialogRef?.current?.openDialog()
                              : premiumWarningDialogRef.current?.openDialog()
                          }}
                        >
                          {translate('text_638906e7b4f1a919cb61d0f2')}
                        </Button>
                      )}
                    </>
                  }
                />

                <Typography color="grey700">
                  {translate('text_638f743fa9a2a9545ee6409a', {
                    zone: translate(timezone || TimezoneEnum.TzUtc),
                    offset: timezoneConfig.offset,
                  })}
                </Typography>
              </SettingsListItem>

              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_62ab2d0396dd6b0361614d44')}
                  sublabel={translate('text_17279603619058io9kicfxan')}
                  action={
                    <>
                      {hasPermissions(['organizationUpdate']) && (
                        <Button
                          variant="quaternary"
                          onClick={editInfosDialogRef?.current?.openDialog}
                        >
                          {translate('text_6389099378112a8d8e2b73be')}
                        </Button>
                      )}
                    </>
                  }
                />

                <div className="grid w-full grid-cols-2 gap-3">
                  {logoUrl ? (
                    <Avatar className="col-span-2 mb-1" size="big" variant="connector">
                      <img src={logoUrl} alt={`${name}'s logo`} />
                    </Avatar>
                  ) : (
                    <Avatar
                      className="col-span-2 mb-1"
                      size="big"
                      variant="company"
                      identifier={name || ''}
                      initials={(name || '').split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
                    />
                  )}
                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d5c')}
                  </Typography>
                  <Typography className="flex h-7 items-center" variant="body" color="grey700">
                    {name}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d6c')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={legalName ? 'grey700' : 'grey500'}
                  >
                    {legalName ? legalName : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d7c')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={legalNumber ? 'grey700' : 'grey500'}
                  >
                    {legalNumber ? legalNumber : translate('text_62ab2d0396dd6b0361614d74')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_648053ee819b60364c675cf1')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={taxIdentificationNumber ? 'grey700' : 'grey500'}
                  >
                    {taxIdentificationNumber
                      ? taxIdentificationNumber
                      : translate('text_62ab2d0396dd6b0361614d74')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d8c')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={email ? 'grey700' : 'grey500'}
                  >
                    {email ? email : translate('text_62ab2d0396dd6b0361614d84')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d9c')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={addressLine1 ? 'grey700' : 'grey500'}
                  >
                    {addressLine1 ? addressLine1 : translate('text_62ab2d0396dd6b0361614d94')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614dac')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={addressLine2 ? 'grey700' : 'grey500'}
                  >
                    {addressLine2 ? addressLine2 : translate('text_62ab2d0396dd6b0361614da4')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614dc8')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={zipcode ? 'grey700' : 'grey500'}
                  >
                    {zipcode ? zipcode : translate('text_62ab2d0396dd6b0361614dc0')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614dd6')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={city ? 'grey700' : 'grey500'}
                  >
                    {city ? city : translate('text_62ab2d0396dd6b0361614dd0')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614db6')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={state ? 'grey700' : 'grey500'}
                  >
                    {state ? state : translate('text_62ab2d0396dd6b0361614db0')}
                  </Typography>

                  <Typography className="flex h-7 items-center" variant="caption">
                    {translate('text_62ab2d0396dd6b0361614de3')}
                  </Typography>
                  <Typography
                    className="flex h-7 items-center"
                    variant="body"
                    color={country ? 'grey700' : 'grey500'}
                  >
                    {country ? CountryCodes[country] : translate('text_62ab2d0396dd6b0361614ddd')}
                  </Typography>
                </div>
              </SettingsListItem>
            </>
          )}
        </SettingsListWrapper>
      </SettingsPaddedContainer>

      <EditOrganizationInformationsDialog
        ref={editInfosDialogRef}
        organization={data?.organization as EditOrganizationInformationsDialogFragment}
      />
      <EditOrganizationTimezoneDialog ref={editTimezoneDialogRef} timezone={timezone} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default OrganizationInformations
