import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, NavigateFunction, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import CustomerPortalLoading from '~/components/customerPortal/common/CustomerPortalLoading'
import CustomerPortalSidebar from '~/components/customerPortal/common/CustomerPortalSidebar'
import SectionError from '~/components/customerPortal/common/SectionError'
import {
  LoaderCustomerInformationSection,
  LoaderInvoicesListSection,
  LoaderUsageSection,
  LoaderWalletSection,
} from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
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
  portalIsLoading?: boolean
  portalIsError?: boolean
}

type ChangePageProps = {
  newPage: string
  itemId?: string
}

type UseCustomerPortalNavigationProps = {
  navigate: NavigateFunction
  token?: string
}

const useCustomerPortalNavigation = ({ navigate, token }: UseCustomerPortalNavigationProps) => {
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

  return {
    changePage,
    goHome,
    viewSubscription,
    viewWallet,
    viewEditInformation,
  }
}

const CustomerPortal = ({
  translate,
  documentLocale,
  portalIsLoading,
  portalIsError,
}: CutsomerPortalProps) => {
  const customerPortalContentRef = useRef<HTMLDivElement>(null)

  const { token, page } = useParams()
  const navigate = useNavigate()

  const { goHome, viewSubscription, viewWallet, viewEditInformation } = useCustomerPortalNavigation(
    { navigate, token },
  )

  const {
    data: portalOrgaInfosData,
    loading: portalOrgasInfoLoading,
    error: portalOrgasInfoError,
  } = useGetPortalOrgaInfosQuery()

  useEffect(() => {
    customerPortalContentRef.current?.scrollTo?.(0, 0)
  }, [page])

  if (portalIsError) {
    return (
      <div className="flex flex-col md:flex-row">
        <CustomerPortalSidebar
          organizationName={portalOrgaInfosData?.customerPortalOrganization?.name}
          organizationLogoUrl={portalOrgaInfosData?.customerPortalOrganization?.logoUrl}
          isLoading={portalOrgasInfoLoading}
          isError={portalOrgasInfoError}
        />

        <div className="h-screen w-full max-w-screen-lg overflow-y-auto p-4 md:p-20">
          <SectionError
            customTitle={translate('text_1728546284339z3fs0oqdejs')}
            hideDescription={true}
          />
        </div>
      </div>
    )
  }

  if (portalIsLoading) {
    return (
      <div className="flex flex-col md:flex-row">
        <CustomerPortalSidebar isLoading={true} />

        <div className="h-screen w-full max-w-screen-lg overflow-y-auto p-4 md:p-20">
          <div className="flex flex-col gap-12">
            <div>
              <SectionTitle title="" loading={true} />
              <LoaderWalletSection />
            </div>
            <div>
              <SectionTitle title="" loading={true} />
              <LoaderUsageSection />
            </div>
            <div>
              <SectionTitle title="" loading={true} />
              <LoaderCustomerInformationSection />
            </div>
            <div>
              <SectionTitle title="" loading={true} />
              <LoaderInvoicesListSection />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row">
      <CustomerPortalSidebar
        organizationName={portalOrgaInfosData?.customerPortalOrganization?.name}
        organizationLogoUrl={portalOrgaInfosData?.customerPortalOrganization?.logoUrl}
        isLoading={portalOrgasInfoLoading}
        isError={portalOrgasInfoError}
      />

      <div
        className="h-screen w-full max-w-screen-lg overflow-y-auto p-4 md:p-20"
        ref={customerPortalContentRef}
      >
        {portalOrgasInfoLoading && <CustomerPortalLoading />}

        {!portalOrgasInfoLoading && !page && (
          <div className="flex flex-col gap-12">
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
          </div>
        )}

        {!portalOrgasInfoLoading && page === 'usage' && <UsagePage goHome={goHome} />}

        {!portalOrgasInfoLoading && page === 'wallet' && (
          <WalletPage goHome={goHome} onSuccess={goHome} />
        )}

        {!portalOrgasInfoLoading && page === 'customer-edit-information' && (
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
