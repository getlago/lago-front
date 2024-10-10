import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'

import CustomerPortalLoading from '~/components/customerPortal/common/CustomerPortalLoading'
import CustomerPortalSidebar from '~/components/customerPortal/common/CustomerPortalSidebar'
import useCustomerPortalNavigation from '~/components/customerPortal/common/hooks/useCustomerPortalNavigation'
import SectionError from '~/components/customerPortal/common/SectionError'
import {
  LoaderCustomerInformationSection,
  LoaderInvoicesListSection,
  LoaderUsageSection,
  LoaderWalletSection,
} from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import { hasDefinedGQLError } from '~/core/apolloClient'
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

const CustomerPortal = () => {
  const {
    translate,
    error: customerPortalTranslateError,
    loading: portalIsLoading,
  } = useCustomerPortalTranslate()

  const portalIsError =
    customerPortalTranslateError && hasDefinedGQLError('Unauthorized', customerPortalTranslateError)

  const customerPortalContentRef = useRef<HTMLDivElement>(null)

  const { pathname } = useCustomerPortalNavigation()

  const {
    data: portalOrgaInfosData,
    loading: portalOrgasInfoLoading,
    error: portalOrgasInfoError,
  } = useGetPortalOrgaInfosQuery()

  useEffect(() => {
    customerPortalContentRef.current?.scrollTo?.(0, 0)
  }, [pathname])

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

      <div className="h-screen w-full overflow-y-auto p-4 md:p-20" ref={customerPortalContentRef}>
        <div className="max-w-screen-lg">
          {portalOrgasInfoLoading && <CustomerPortalLoading />}

          {!portalOrgasInfoLoading && <Outlet />}
        </div>
      </div>
    </div>
  )
}

export default CustomerPortal
