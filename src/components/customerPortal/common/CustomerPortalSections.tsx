import { Typography } from 'lago-design-system'

import useCustomerPortalNavigation from '~/components/customerPortal/common/hooks/useCustomerPortalNavigation'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import PortalCustomerInfos from '~/components/customerPortal/PortalCustomerInfos'
import PortalInvoicesList from '~/components/customerPortal/PortalInvoicesList'
import UsageSection from '~/components/customerPortal/usage/UsageSection'
import WalletSection from '~/components/customerPortal/wallet/WalletSection'
import { PremiumIntegrationTypeEnum, useGetPortalOrgaInfosQuery } from '~/generated/graphql'
import Logo from '~/public/images/logo/lago-logo-grey.svg'

const CustomerPortalSections = () => {
  const { translate } = useCustomerPortalTranslate()

  const { data: portalOrgaInfosData } = useGetPortalOrgaInfosQuery()

  const { viewWallet, viewSubscription, viewEditInformation } = useCustomerPortalNavigation()

  const showPoweredBy =
    !portalOrgaInfosData?.customerPortalOrganization?.premiumIntegrations?.includes(
      PremiumIntegrationTypeEnum.RemoveBrandingWatermark,
    )

  return (
    <div className="flex flex-col gap-12">
      <WalletSection viewWallet={viewWallet} />
      <UsageSection viewSubscription={viewSubscription} />
      <PortalCustomerInfos viewEditInformation={viewEditInformation} />
      <PortalInvoicesList />

      {showPoweredBy && (
        <div className="my-8 flex justify-center gap-2 md:hidden">
          <Typography variant="body" color="grey600">
            {translate('text_6419c64eace749372fc72b03')}
          </Typography>

          <Logo width="40px" />
        </div>
      )}
    </div>
  )
}

export default CustomerPortalSections
