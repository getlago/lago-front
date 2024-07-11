import { gql } from '@apollo/client'
import styled from 'styled-components'

import { PortalCustomerInfos } from '~/components/customerPortal/PortalCustomerInfos'
import PortalInvoicesList from '~/components/customerPortal/PortalInvoicesList'
import { PortalOverview } from '~/components/customerPortal/PortalOverview'
import { Skeleton, Typography } from '~/components/designSystem'
import { LocaleEnum } from '~/core/translations'
import { useGetPortalOrgaInfosQuery } from '~/generated/graphql'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { theme } from '~/styles'

gql`
  query getPortalOrgaInfos {
    customerPortalOrganization {
      id
      name
      logoUrl
    }
  }
`

interface CutsomerPortalProps {
  translate: Function
  documentLocale: LocaleEnum
}

const CustomerPortal = ({ translate, documentLocale }: CutsomerPortalProps) => {
  const { data, loading } = useGetPortalOrgaInfosQuery()

  return (
    <PageWrapper>
      <PageHeader>
        {loading ? (
          <InlineItems>
            <Skeleton variant="connectorAvatar" size="big" marginRight={theme.spacing(3)} />
            <Skeleton variant="text" height={12} width={120} />
          </InlineItems>
        ) : (
          <InlineItems>
            {!!data?.customerPortalOrganization?.logoUrl && (
              <OrgaLogoContainer>
                <img
                  src={data.customerPortalOrganization?.logoUrl}
                  alt={`${data.customerPortalOrganization?.name}'s logo`}
                />
              </OrgaLogoContainer>
            )}
            <Typography variant="headline">{data?.customerPortalOrganization?.name}</Typography>
          </InlineItems>
        )}
        <InlineItems>
          <InlinePoweredByTypography variant="note" color="grey500">
            {translate('text_6419c64eace749372fc72b03')}
          </InlinePoweredByTypography>
          <StyledLogo />
        </InlineItems>
      </PageHeader>

      <PortalCustomerInfos translate={translate} />
      <PortalOverview translate={translate} documentLocale={documentLocale} />
      <PortalInvoicesList translate={translate} documentLocale={documentLocale} />
    </PageWrapper>
  )
}

const InlineItems = styled.div`
  display: flex;
  align-items: center;
`

const InlinePoweredByTypography = styled(Typography)`
  margin-right: ${theme.spacing(1)};
`

const StyledLogo = styled(Logo)`
  width: 40px;
`

const PageWrapper = styled.div`
  max-width: 1024px;
  margin: ${theme.spacing(20)} auto;
  padding: 0 ${theme.spacing(4)};

  > section {
    margin-bottom: ${theme.spacing(12)};
  }
`

const PageHeader = styled.section`
  display: flex;
  justify-content: space-between;

  > div:first-child {
    width: 100%;
    flex: 1;
  }
`

const OrgaLogoContainer = styled.div`
  width: 40px;
  height: 40px;
  margin-right: ${theme.spacing(3)};
  border-radius: 8px;

  > img {
    height: 100%;
    width: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
`

export default CustomerPortal
