import { memo } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Skeleton, Typography } from '~/components/designSystem'
import { useGetPortalCustomerInfosQuery } from '~/generated/graphql'
import { CountryCodes } from '~/core/countryCodes'
import { NAV_HEIGHT, theme } from '~/styles'

gql`
  query getPortalCustomerInfos {
    customerPortalUser {
      id
      name
      legalName
      legalNumber
      taxIdentificationNumber
      email
      addressLine1
      addressLine2
      state
      country
      city
      zipcode
    }
  }
`

interface PortalCustomerInfosProps {
  translate: Function
}

export const PortalCustomerInfos = memo(({ translate }: PortalCustomerInfosProps) => {
  const { data, loading } = useGetPortalCustomerInfosQuery()
  const customerPortalUser = data?.customerPortalUser

  return (
    <section>
      <Title variant="subhead">{translate('text_6419c64eace749372fc72b07')}</Title>
      <InfosContainer>
        {loading ? (
          <InfoSkeletonContainer>
            {[1, 2].map((i) => (
              <InfoSkeletonLine key={`key-skeleton-line-${i}`}>
                <Skeleton variant="text" width="12%" height={12} marginRight={32} />
                <Skeleton variant="text" width="38%" height={12} />
              </InfoSkeletonLine>
            ))}
          </InfoSkeletonContainer>
        ) : (
          <>
            <div>
              <InfoLine>
                <Typography variant="caption" color="grey600">
                  {translate('text_6419c64eace749372fc72b0f')}
                </Typography>
                <Typography variant="body" color={customerPortalUser?.name ? 'grey700' : 'grey500'}>
                  {customerPortalUser?.name || translate('text_6419c64eace749372fc72b0b')}
                </Typography>
              </InfoLine>
              <InfoLine>
                <Typography variant="caption" color="grey600">
                  {translate('text_6419c64eace749372fc72b17')}
                </Typography>
                <Typography
                  variant="body"
                  color={customerPortalUser?.legalName ? 'grey700' : 'grey500'}
                >
                  {customerPortalUser?.legalName || translate('text_6419c64eace749372fc72b13')}
                </Typography>
              </InfoLine>
              <InfoLine>
                <Typography variant="caption" color="grey600">
                  {translate('text_647ddd5220412a009bfd36f4')}
                </Typography>
                <Typography
                  variant="body"
                  color={customerPortalUser?.legalNumber ? 'grey700' : 'grey500'}
                >
                  {customerPortalUser?.legalNumber || translate('text_647ddd5f54fefd00c5754bca')}
                </Typography>
              </InfoLine>
              <InfoLine>
                <Typography variant="caption" color="grey600">
                  {translate('text_6480a70109b61a005b2092df')}
                </Typography>
                <Typography
                  variant="body"
                  color={customerPortalUser?.taxIdentificationNumber ? 'grey700' : 'grey500'}
                >
                  {customerPortalUser?.taxIdentificationNumber ||
                    translate('text_6480a707530c5c0053cd11e1')}
                </Typography>
              </InfoLine>
            </div>
            <div>
              <InfoLine>
                <Typography variant="caption" color="grey600">
                  {translate('text_6419c64eace749372fc72b27')}
                </Typography>
                <Typography
                  variant="body"
                  color={customerPortalUser?.email ? 'grey700' : 'grey500'}
                >
                  {customerPortalUser?.email || translate('text_6419c64eace749372fc72b23')}
                </Typography>
              </InfoLine>
              <InfoLine>
                <Typography variant="caption" color="grey600">
                  {translate('text_6419c64eace749372fc72b2f')}
                </Typography>
                {!(
                  customerPortalUser?.addressLine1 ||
                  customerPortalUser?.addressLine2 ||
                  customerPortalUser?.state ||
                  customerPortalUser?.country ||
                  customerPortalUser?.city ||
                  customerPortalUser?.zipcode
                ) ? (
                  <Typography variant="body" color="grey500">
                    {translate('text_6419c64eace749372fc72b2b')}
                  </Typography>
                ) : (
                  <div>
                    {customerPortalUser?.addressLine1 && (
                      <Typography variant="body" color="grey700">
                        {customerPortalUser?.addressLine1}
                      </Typography>
                    )}
                    {customerPortalUser?.addressLine2 && (
                      <Typography variant="body" color="grey700">
                        {customerPortalUser?.addressLine2}
                      </Typography>
                    )}
                    {(customerPortalUser?.zipcode ||
                      customerPortalUser?.city ||
                      customerPortalUser?.state) && (
                      <Typography variant="body" color="grey700">
                        {customerPortalUser?.zipcode} {customerPortalUser?.city}{' '}
                        {customerPortalUser?.state}
                      </Typography>
                    )}
                    {customerPortalUser?.country && (
                      <Typography variant="body" color="grey700">
                        {CountryCodes[customerPortalUser?.country]}
                      </Typography>
                    )}
                  </div>
                )}
              </InfoLine>
            </div>
          </>
        )}
      </InfosContainer>
    </section>
  )
})

PortalCustomerInfos.displayName = 'PortalCustomerInfos'

const InfoSkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing(2)} ${theme.spacing(1)};
`
const InfoSkeletonLine = styled.div`
  display: flex;

  &:not(:last-child) {
    margin-bottom: ${theme.spacing(7)};
  }
`

const Title = styled(Typography)`
  display: flex;
  align-items: center;
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  margin-bottom: ${theme.spacing(6)};
`

const InfosContainer = styled.section`
  display: flex;
  column-gap: ${theme.spacing(8)};

  > * {
    flex: 1;
  }

  ${theme.breakpoints.down('md')} {
    flex-direction: column;
  }
`

const InfoLine = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: ${theme.spacing(2)};

  > div:first-child {
    min-width: 140px;
    white-space: break-spaces;
    margin-top: ${theme.spacing(1)};
    margin-right: ${theme.spacing(3)};
  }

  > div:last-child {
    width: 100%;
    line-break: anywhere;
  }

  > a {
    color: ${theme.palette.primary[600]};

    > * {
      color: inherit;
    }
  }
`
