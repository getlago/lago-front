import { gql } from '@apollo/client'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import CustomerPortalLoading from '~/components/customerPortal/common/CustomerPortalLoading'
import CustomerPortalSidebar from '~/components/customerPortal/common/CustomerPortalSidebar'
import { PortalCustomerInfos } from '~/components/customerPortal/PortalCustomerInfos'
import PortalInvoicesList from '~/components/customerPortal/PortalInvoicesList'
import { PortalOverview } from '~/components/customerPortal/PortalOverview'
import UsagePage from '~/components/customerPortal/usage/UsagePage'
import UsageSection from '~/components/customerPortal/usage/UsageSection'
import {
  CUSTOMER_PORTAL_ROUTE,
  CUSTOMER_PORTAL_ROUTE_PAGE,
} from '~/core/router/CustomerPortalRoutes'
import { LocaleEnum } from '~/core/translations'
import { useGetPortalOrgaInfosQuery } from '~/generated/graphql'

gql`
  query getPortalOrgaInfos {
    customerPortalOrganization {
      id
      name
      logoUrl
      premiumIntegrations
    }
  }
`

interface CutsomerPortalProps {
  translate: Function
  documentLocale: LocaleEnum
}

const CustomerPortal = ({ translate, documentLocale }: CutsomerPortalProps) => {
  const { data, loading } = useGetPortalOrgaInfosQuery()

  const { token, page } = useParams()

  const navigate = useNavigate()

  const changePage = ({ newPage, itemId }: { newPage: string; itemId: string }) => {
    navigate(
      generatePath(CUSTOMER_PORTAL_ROUTE_PAGE, { token: token as string, page: newPage, itemId }),
    )
  }

  const goHome = () => {
    navigate(generatePath(CUSTOMER_PORTAL_ROUTE, { token: token as string }))
  }

  const viewSubscription = (id: string) => {
    changePage({
      newPage: 'usage',
      itemId: id,
    })
  }

  return (
    <div className="flex flex-col md:flex-row">
      <CustomerPortalSidebar
        organizationName={data?.customerPortalOrganization?.name}
        organizationLogoUrl={data?.customerPortalOrganization?.logoUrl}
      />

      <div className="h-screen w-full overflow-y-auto px-20 pt-16">
        {loading && <CustomerPortalLoading />}

        {!loading && !page && (
          <>
            <UsageSection viewSubscription={viewSubscription} />
            <PortalCustomerInfos translate={translate} />
            <PortalOverview translate={translate} documentLocale={documentLocale} />
            <PortalInvoicesList translate={translate} documentLocale={documentLocale} />
          </>
        )}

        {!loading && page === 'usage' && <UsagePage goHome={goHome} />}
      </div>
    </div>
  )
}

export default CustomerPortal
