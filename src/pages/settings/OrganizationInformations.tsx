import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Avatar, Button, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme, NAV_HEIGHT } from '~/styles'
import {
  useGetOrganizationInformationsQuery,
  EditOrganizationInformationsDialogFragmentDoc,
} from '~/generated/graphql'
import {
  EditOrganizationInformationsDialog,
  EditOrganizationInformationsDialogRef,
} from '~/components/settings/EditOrganizationInformationsDialog'
import {
  EditOrganizationTimezoneDialog,
  EditOrganizationTimezoneDialogRef,
} from '~/components/settings/EditOrganizationTimezoneDialog'
import CountryCodes from '~/public/countryCode.json'
import { useOrganizationTimezone } from '~/hooks/useOrganizationTimezone'

gql`
  fragment OrganizationInformations on Organization {
    id
    logoUrl
    name
    legalName
    legalNumber
    email
    addressLine1
    addressLine2
    zipcode
    city
    state
    country
  }

  query getOrganizationInformations {
    currentUser {
      organizations {
        ...OrganizationInformations
        ...EditOrganizationInformationsDialog
      }
    }
  }
  ${EditOrganizationInformationsDialogFragmentDoc}
`

const OrganizationInformations = () => {
  const { translate } = useInternationalization()
  const editInfosDialogRef = useRef<EditOrganizationInformationsDialogRef>(null)
  const editTimezoneDialogRef = useRef<EditOrganizationTimezoneDialogRef>(null)
  const { data, loading, error } = useGetOrganizationInformationsQuery()
  const organization = (data?.currentUser?.organizations || [])[0]
  const { timezoneConfig, timezone } = useOrganizationTimezone()

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
    <Page>
      <Title variant="headline">{translate('text_62ab2d0396dd6b0361614d2c')}</Title>
      <Subtitle>{translate('text_6380d7e60f081e5b777c4b22')}</Subtitle>

      <Grid>
        <Head>
          <Typography variant="subhead">{translate('text_638906e7b4f1a919cb61d0f4')}</Typography>
          {/* TODO: Hidden before liscence release
          <Button
            variant="quaternary"
            disabled={!!loading}
            onClick={editTimezoneDialogRef?.current?.openDialog}
          >
            {translate('text_638906e7b4f1a919cb61d0f2')}
          </Button> */}
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
                zone: translate(timezone || 'TZ_UTC'),
                offset: timezoneConfig.offset,
              })}
            </Timezone>
            <Typography variant="caption">{translate('text_638f5198de9e80bb75fc2feb')}</Typography>
          </TimezoneBlock>
        )}

        <Head $withTopSeparator>
          <Typography variant="subhead">{translate('text_62ab2d0396dd6b0361614d44')}</Typography>
          <Button
            variant="quaternary"
            disabled={!!loading}
            onClick={editInfosDialogRef?.current?.openDialog}
          >
            {translate('text_6389099378112a8d8e2b73be')}
          </Button>
        </Head>

        {!!loading ? (
          <div>
            <Skeleton variant="connectorAvatar" size="medium" marginBottom={theme.spacing(6)} />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((skeletonLine) => (
              <SkeletonLine key={`skeleton-${skeletonLine}`}>
                <Skeleton variant="text" width={80} height={12} />
                <Skeleton variant="text" width={240} height={12} />
              </SkeletonLine>
            ))}
          </div>
        ) : (
          <>
            {organization.logoUrl ? (
              <CompanyAvatar size="medium" variant="connector">
                <img src={organization.logoUrl} alt={`${organization.name}'s logo`} />
              </CompanyAvatar>
            ) : (
              <CompanyAvatar
                size="medium"
                variant="company"
                identifier={organization.name || ''}
                initials={(organization.name || '')
                  .split(' ')
                  .reduce((acc, n) => (acc = acc + n[0]), '')}
              />
            )}
            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d5c')}</SimpleCell>
            <SimpleCell variant="body" color="grey700">
              {organization.name}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d6c')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.legalName ? 'grey700' : 'grey500'}>
              {organization?.legalName
                ? organization.legalName
                : translate('text_62ab2d0396dd6b0361614d64')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d7c')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.legalNumber ? 'grey700' : 'grey500'}>
              {organization?.legalNumber
                ? organization.legalNumber
                : translate('text_62ab2d0396dd6b0361614d74')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d8c')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.email ? 'grey700' : 'grey500'}>
              {organization?.email
                ? organization.email
                : translate('text_62ab2d0396dd6b0361614d84')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614d9c')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.addressLine1 ? 'grey700' : 'grey500'}>
              {organization?.addressLine1
                ? organization.addressLine1
                : translate('text_62ab2d0396dd6b0361614d94')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614dac')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.addressLine2 ? 'grey700' : 'grey500'}>
              {organization?.addressLine2
                ? organization.addressLine2
                : translate('text_62ab2d0396dd6b0361614da4')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614dc8')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.zipcode ? 'grey700' : 'grey500'}>
              {organization?.zipcode
                ? organization.zipcode
                : translate('text_62ab2d0396dd6b0361614dc0')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614dd6')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.city ? 'grey700' : 'grey500'}>
              {organization?.city ? organization.city : translate('text_62ab2d0396dd6b0361614dd0')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614db6')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.state ? 'grey700' : 'grey500'}>
              {organization?.state
                ? organization.state
                : translate('text_62ab2d0396dd6b0361614db0')}
            </SimpleCell>

            <SimpleCell variant="caption">{translate('text_62ab2d0396dd6b0361614de3')}</SimpleCell>
            <SimpleCell variant="body" color={organization?.country ? 'grey700' : 'grey500'}>
              {organization?.country
                ? CountryCodes[organization.country]
                : translate('text_62ab2d0396dd6b0361614ddd')}
            </SimpleCell>
          </>
        )}
      </Grid>
      <EditOrganizationInformationsDialog ref={editInfosDialogRef} organization={organization} />
      <EditOrganizationTimezoneDialog ref={editTimezoneDialogRef} />
    </Page>
  )
}

const Page = styled.div`
  max-width: ${theme.spacing(168)};
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

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
  margin-bottom: ${theme.spacing(1)};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${theme.spacing(3)} ${theme.spacing(6)};
  width: 100%;
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
  margin-top: ${({ $withTopSeparator }) => ($withTopSeparator ? theme.spacing(5) : 0)};
  margin-bottom: -${theme.spacing(3)};
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
