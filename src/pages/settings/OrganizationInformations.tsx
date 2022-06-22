import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Avatar, Button, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'
import {
  useGetOrganizationInformationsQuery,
  EditOrganizationInformationsDialogFragmentDoc,
} from '~/generated/graphql'
import {
  EditOrganizationInformationsDialog,
  EditOrganizationInformationsDialogRef,
} from '~/components/settings/EditOrganizationInformationsDialog'
import CountryCodes from '~/public/countryCode.json'

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
  const editDialogRef = useRef<EditOrganizationInformationsDialogRef>(null)
  const { data, loading, error } = useGetOrganizationInformationsQuery()
  const organization = (data?.currentUser?.organizations || [])[0]

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <Page>
      <Title variant="headline">{translate('text_62ab2d0396dd6b0361614d2c')}</Title>
      <Subtitle>{translate('text_62ab2d0396dd6b0361614d34')}</Subtitle>
      <Head>
        <Typography variant="subhead">{translate('text_62ab2d0396dd6b0361614d44')}</Typography>
        <Button
          variant="secondary"
          disabled={!!loading}
          onClick={editDialogRef?.current?.openDialog}
        >
          {translate('text_62ab2d0396dd6b0361614d3c')}
        </Button>
      </Head>
      {!!loading ? (
        <>
          <Skeleton variant="connectorAvatar" size="medium" marginBottom={theme.spacing(4)} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((skeletonLine) => (
            <SkeletonLine key={`skeleton-${skeletonLine}`}>
              <Skeleton variant="text" width={80} height={12} />
              <Skeleton variant="text" width={240} height={12} />
            </SkeletonLine>
          ))}
        </>
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

          <Table>
            <tbody>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d30')}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color="grey700">
                    {organization?.name
                      ? organization.name
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d40')}
                  </Typography>
                </td>
                <td>
                  <Typography
                    variant="body"
                    color={organization?.legalName ? 'grey700' : 'grey500'}
                  >
                    {organization?.legalName
                      ? organization.legalName
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d50')}
                  </Typography>
                </td>
                <td>
                  <Typography
                    variant="body"
                    color={organization?.legalNumber ? 'grey700' : 'grey500'}
                  >
                    {organization?.legalNumber
                      ? organization.legalNumber
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d60')}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color={organization?.email ? 'grey700' : 'grey500'}>
                    {organization?.email
                      ? organization.email
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d78')}
                  </Typography>
                </td>
                <td>
                  <Typography
                    variant="body"
                    color={organization?.addressLine1 ? 'grey700' : 'grey500'}
                  >
                    {organization?.addressLine1
                      ? organization.addressLine1
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d80')}
                  </Typography>
                </td>
                <td>
                  <Typography
                    variant="body"
                    color={organization?.addressLine2 ? 'grey700' : 'grey500'}
                  >
                    {organization?.addressLine2
                      ? organization.addressLine2
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d88')}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color={organization?.zipcode ? 'grey700' : 'grey500'}>
                    {organization?.zipcode
                      ? organization.zipcode
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d90')}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color={organization?.city ? 'grey700' : 'grey500'}>
                    {organization?.city
                      ? organization.city
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614d98')}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color={organization?.state ? 'grey700' : 'grey500'}>
                    {organization?.state
                      ? organization.state
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="caption">
                    {translate('text_62ab2d0396dd6b0361614da0')}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color={organization?.country ? 'grey700' : 'grey500'}>
                    {organization?.country
                      ? CountryCodes[organization.country]
                      : translate('text_62ab2d0396dd6b0361614d64')}
                  </Typography>
                </td>
              </tr>
            </tbody>
          </Table>
        </>
      )}
      <EditOrganizationInformationsDialog ref={editDialogRef} organization={organization} />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(12)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const Head = styled.div`
  padding: ${theme.spacing(4)} 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  margin-bottom: ${theme.spacing(6)};
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
  margin-bottom: ${theme.spacing(4)};
`

const Table = styled.table`
  & tr td {
    padding-bottom: ${theme.spacing(3)};
  }

  & tr td:first-child {
    padding-right: ${theme.spacing(3)};
  }
`

export default OrganizationInformations
