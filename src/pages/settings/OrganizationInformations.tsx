import { gql } from '@apollo/client'
import { useRef } from 'react'
import styled from 'styled-components'

import { Avatar, Button, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
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
import { NAV_HEIGHT, theme } from '~/styles'
import { SettingsHeaderNameWrapper, SettingsPageContentWrapper } from '~/styles/settingsPage'

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
      <SettingsHeaderNameWrapper>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_62ab2d0396dd6b0361614d2c')}
        </Typography>
      </SettingsHeaderNameWrapper>

      <SettingsPageContentWrapper>
        <Title variant="headline">{translate('text_62ab2d0396dd6b0361614d2c')}</Title>
        <Subtitle>{translate('text_6380d7e60f081e5b777c4b22')}</Subtitle>

        <Head>
          <Typography variant="subhead">{translate('text_638906e7b4f1a919cb61d0f4')}</Typography>
          {hasPermissions(['organizationUpdate']) && (
            <Button
              variant="quaternary"
              disabled={!!loading}
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
        </Head>
        {!!loading ? (
          <SkeletonLine>
            <Skeleton variant="text" width={80} height={12} />
            <Skeleton variant="text" width={240} height={12} />
          </SkeletonLine>
        ) : (
          <TimezoneBlock>
            <Timezone color="grey700">
              {translate('text_638f743fa9a2a9545ee6409a', {
                zone: translate(timezone || TimezoneEnum.TzUtc),
                offset: timezoneConfig.offset,
              })}
            </Timezone>
            <Typography variant="caption">{translate('text_638f5198de9e80bb75fc2feb')}</Typography>
          </TimezoneBlock>
        )}

        <Head $withTopSeparator>
          <Typography variant="subhead">{translate('text_62ab2d0396dd6b0361614d44')}</Typography>

          {hasPermissions(['organizationUpdate']) && (
            <Button
              variant="quaternary"
              disabled={!!loading}
              onClick={editInfosDialogRef?.current?.openDialog}
            >
              {translate('text_6389099378112a8d8e2b73be')}
            </Button>
          )}
        </Head>

        {!!loading ? (
          <div>
            <Skeleton variant="connectorAvatar" size="big" marginBottom={theme.spacing(6)} />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((skeletonLine) => (
              <SkeletonLine key={`skeleton-${skeletonLine}`}>
                <Skeleton variant="text" width={80} height={12} />
                <Skeleton variant="text" width={240} height={12} />
              </SkeletonLine>
            ))}
          </div>
        ) : (
          <Grid>
            {logoUrl ? (
              <CompanyAvatar size="big" variant="connector">
                <img src={logoUrl} alt={`${name}'s logo`} />
              </CompanyAvatar>
            ) : (
              <CompanyAvatar
                size="big"
                variant="company"
                identifier={name || ''}
                initials={(name || '').split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
              />
            )}
            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d5c')}</SimpleCell>
            <SimpleCell variant="body" color="grey700">
              {name}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d6c')}</SimpleCell>
            <SimpleCell variant="body" color={legalName ? 'grey700' : 'grey500'}>
              {legalName ? legalName : translate('text_62ab2d0396dd6b0361614d64')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d7c')}</SimpleCell>
            <SimpleCell variant="body" color={legalNumber ? 'grey700' : 'grey500'}>
              {legalNumber ? legalNumber : translate('text_62ab2d0396dd6b0361614d74')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_648053ee819b60364c675cf1')}</SimpleCell>
            <SimpleCell variant="body" color={taxIdentificationNumber ? 'grey700' : 'grey500'}>
              {taxIdentificationNumber
                ? taxIdentificationNumber
                : translate('text_62ab2d0396dd6b0361614d74')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d8c')}</SimpleCell>
            <SimpleCell variant="body" color={email ? 'grey700' : 'grey500'}>
              {email ? email : translate('text_62ab2d0396dd6b0361614d84')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d9c')}</SimpleCell>
            <SimpleCell variant="body" color={addressLine1 ? 'grey700' : 'grey500'}>
              {addressLine1 ? addressLine1 : translate('text_62ab2d0396dd6b0361614d94')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614dac')}</SimpleCell>
            <SimpleCell variant="body" color={addressLine2 ? 'grey700' : 'grey500'}>
              {addressLine2 ? addressLine2 : translate('text_62ab2d0396dd6b0361614da4')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614dc8')}</SimpleCell>
            <SimpleCell variant="body" color={zipcode ? 'grey700' : 'grey500'}>
              {zipcode ? zipcode : translate('text_62ab2d0396dd6b0361614dc0')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614dd6')}</SimpleCell>
            <SimpleCell variant="body" color={city ? 'grey700' : 'grey500'}>
              {city ? city : translate('text_62ab2d0396dd6b0361614dd0')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614db6')}</SimpleCell>
            <SimpleCell variant="body" color={state ? 'grey700' : 'grey500'}>
              {state ? state : translate('text_62ab2d0396dd6b0361614db0')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614de3')}</SimpleCell>
            <SimpleCell variant="body" color={country ? 'grey700' : 'grey500'}>
              {country ? CountryCodes[country] : translate('text_62ab2d0396dd6b0361614ddd')}
            </SimpleCell>
          </Grid>
        )}

        <EditOrganizationInformationsDialog
          ref={editInfosDialogRef}
          organization={data?.organization as EditOrganizationInformationsDialogFragment}
        />
        <EditOrganizationTimezoneDialog ref={editTimezoneDialogRef} timezone={timezone} />
        <PremiumWarningDialog ref={premiumWarningDialogRef} />
      </SettingsPageContentWrapper>
    </>
  )
}

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const SkeletonLine = styled.div`
  width: ${theme.spacing(98)};

  justify-content: space-between;
  display: flex;

  &:not(:last-child) {
    margin-bottom: ${theme.spacing(7)};
  }

  &:first-child {
    margin-right: ${theme.spacing(18)};
  }
`

const CompanyAvatar = styled(Avatar)`
  grid-column: 1 / span 2;
  margin-bottom: ${theme.spacing(3)};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${theme.spacing(2)} ${theme.spacing(6)};
  width: 100%;
  padding-bottom: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
`

const SimpleCell = styled(Typography)`
  height: 28px;
  display: flex;
  align-items: center;
`

const Head = styled.div<{ $withTopSeparator?: boolean }>`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ $withTopSeparator }) => ($withTopSeparator ? theme.spacing(8) : 0)};
  grid-column: 1 / span 2;
  box-shadow: ${({ $withTopSeparator }) => ($withTopSeparator ? theme.shadows[5] : 'none')};
`

const Timezone = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

const TimezoneBlock = styled.div`
  grid-column: 1 / span 2;
`

export default OrganizationInformations
