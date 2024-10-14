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
import { tw } from '~/styles/utils'

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
  const isInsideIframe = window.top !== window.self
  const showSidebar = !isInsideIframe

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

  const containerClassName = tw(
    'flex flex-col bg-white md:flex-row',
    !showSidebar && 'justify-center',
  )

  const contentContainerClassName = tw(
    'h-screen w-full overflow-y-auto bg-white p-4',
    showSidebar && 'md:p-20',
  )

  const contentInnerContainerClassName = tw(showSidebar && 'max-w-screen-lg')

  const pageContainerClassName = tw(showSidebar && 'max-w-2xl')

  useEffect(() => {
    customerPortalContentRef.current?.scrollTo?.(0, 0)
  }, [pathname])

  if (portalIsError) {
    return (
      <div className={containerClassName}>
        {showSidebar && (
          <CustomerPortalSidebar
            organizationName={portalOrgaInfosData?.customerPortalOrganization?.name}
            organizationLogoUrl={portalOrgaInfosData?.customerPortalOrganization?.logoUrl}
            isLoading={portalOrgasInfoLoading}
            isError={portalOrgasInfoError}
          />
        )}

        <div className={contentContainerClassName}>
          <div className={contentInnerContainerClassName}>
            <SectionError
              customTitle={translate('text_1728546284339z3fs0oqdejs')}
              hideDescription={true}
            />
          </div>
        </div>
      </div>
    )
  }

  if (portalIsLoading) {
    return (
      <div className={containerClassName}>
        {showSidebar && <CustomerPortalSidebar isLoading={true} />}

        <div className={contentContainerClassName}>
          <div className={contentInnerContainerClassName}>
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
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      {showSidebar && (
        <CustomerPortalSidebar
          organizationName={portalOrgaInfosData?.customerPortalOrganization?.name}
          organizationLogoUrl={portalOrgaInfosData?.customerPortalOrganization?.logoUrl}
          isLoading={portalOrgasInfoLoading}
          isError={portalOrgasInfoError}
        />
      )}

      <div className={contentContainerClassName} ref={customerPortalContentRef}>
        <div className={contentInnerContainerClassName}>
          {portalOrgasInfoLoading && <CustomerPortalLoading />}

          {!portalOrgasInfoLoading && (
            <div className={pageContainerClassName}>
              <Outlet />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerPortal
