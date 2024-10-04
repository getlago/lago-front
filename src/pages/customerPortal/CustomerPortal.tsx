/*
TODO:
Error pages (Usage, Wallet)
Wallet consumed credits (take into account premium ongoing - see notion)
Wallet info icon next to balance
Refresh button for invoices
Translations
*/
import { gql } from '@apollo/client'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import CustomerPortalLoading from '~/components/customerPortal/common/CustomerPortalLoading'
import CustomerPortalSidebar from '~/components/customerPortal/common/CustomerPortalSidebar'
import CustomerInformationPage from '~/components/customerPortal/customerInformation/CustomerInformationPage'
import PortalCustomerInfos from '~/components/customerPortal/PortalCustomerInfos'
import PortalInvoicesList from '~/components/customerPortal/PortalInvoicesList'
import UsagePage from '~/components/customerPortal/usage/UsagePage'
import UsageSection from '~/components/customerPortal/usage/UsageSection'
import WalletPage from '~/components/customerPortal/wallet/WalletPage'
import WalletSection from '~/components/customerPortal/wallet/WalletSection'
import {
  CUSTOMER_PORTAL_ROUTE,
  CUSTOMER_PORTAL_ROUTE_PAGE,
  CUSTOMER_PORTAL_ROUTE_PAGE_ITEMID,
} from '~/core/router/CustomerPortalRoutes'
import { LocaleEnum } from '~/core/translations'
import { useGetPortalOrgaInfosQuery } from '~/generated/graphql'
import Logo from '~/public/images/logo/lago-logo-grey.svg'

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

type ChangePageProps = {
  newPage: string
  itemId?: string
}

const CustomerPortal = ({ translate, documentLocale }: CutsomerPortalProps) => {
  const { data, loading } = useGetPortalOrgaInfosQuery()

  const { token, page } = useParams()

  const navigate = useNavigate()

  const changePage = ({ newPage, itemId }: ChangePageProps) => {
    if (itemId) {
      return navigate(
        generatePath(CUSTOMER_PORTAL_ROUTE_PAGE_ITEMID, {
          token: token as string,
          page: newPage,
          itemId,
        }),
      )
    }

    return navigate(
      generatePath(CUSTOMER_PORTAL_ROUTE_PAGE, {
        token: token as string,
        page: newPage,
      }),
    )
  }

  const goHome = () => {
    navigate(generatePath(CUSTOMER_PORTAL_ROUTE, { token: token as string }))
  }

  const viewSubscription = (id: string) =>
    changePage({
      newPage: 'usage',
      itemId: id,
    })

  const viewWallet = () =>
    changePage({
      newPage: 'wallet',
    })

  const viewEditInformation = () => changePage({ newPage: 'customer-edit-information' })

  return (
    <div className="flex flex-col md:flex-row">
      <CustomerPortalSidebar
        organizationName={data?.customerPortalOrganization?.name}
        organizationLogoUrl={data?.customerPortalOrganization?.logoUrl}
      />

      <div className="h-screen w-full overflow-y-auto p-20">
        {loading && <CustomerPortalLoading />}

        {!loading && !page && (
          <>
            <WalletSection viewWallet={viewWallet} />
            <UsageSection viewSubscription={viewSubscription} />
            <PortalCustomerInfos viewEditInformation={viewEditInformation} />
            <PortalInvoicesList translate={translate} documentLocale={documentLocale} />

            <div className="my-8 flex justify-center gap-2 md:hidden">
              <div className="text-sm text-grey-600">
                {translate('text_6419c64eace749372fc72b03')}
              </div>

              <StyledLogo />
            </div>
          </>
        )}

        {!loading && page === 'usage' && <UsagePage goHome={goHome} />}
        {!loading && page === 'wallet' && <WalletPage goHome={goHome} />}
        {!loading && page === 'customer-edit-information' && (
          <CustomerInformationPage goHome={goHome} />
        )}
      </div>
    </div>
  )
}

export default CustomerPortal

const StyledLogo = styled(Logo)`
  width: 40px;
`
