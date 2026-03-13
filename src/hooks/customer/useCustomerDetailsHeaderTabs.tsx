import { RefObject } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { CustomerActivityLogs } from '~/components/customers/CustomerActivityLogs'
import { CustomerCreditNotesList } from '~/components/customers/CustomerCreditNotesList'
import { CustomerInvoicesTab } from '~/components/customers/CustomerInvoicesTab'
import { CustomerMainInfos } from '~/components/customers/CustomerMainInfos'
import { CustomerPaymentsTab } from '~/components/customers/CustomerPaymentsTab'
import { CustomerSettings } from '~/components/customers/CustomerSettings'
import { CustomerCoupons } from '~/components/customers/overview/CustomerCoupons'
import { CustomerSubscriptionsList } from '~/components/customers/overview/CustomerSubscriptionsList'
import { CustomerUsage } from '~/components/customers/usage/CustomerUsage'
import { MainHeaderTab } from '~/components/MainHeader'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { CustomerWalletsList } from '~/components/wallets/CustomerWalletList'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import {
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  UPDATE_CUSTOMER_ROUTE,
} from '~/core/router'
import { CustomerAccountTypeEnum, CustomerDetailsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

interface UseCustomerDetailsTabsParams {
  customerId: string
  customer: CustomerDetailsFragment | undefined | null
  loading: boolean
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
}

export function useCustomerDetailsHeaderTabs({
  customerId,
  customer,
  loading,
  premiumWarningDialogRef,
}: UseCustomerDetailsTabsParams): MainHeaderTab[] | undefined {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()
  const { isPremium } = useCurrentUser()

  const {
    creditNotesCreditsAvailableCount,
    creditNotesBalanceAmountCents,
    externalId,
    hasCreditNotes,
    applicableTimezone: safeTimezone,
  } = customer || {}

  const isPartner = customer?.accountType === CustomerAccountTypeEnum.Partner

  if (!customer) return undefined

  const tabs: MainHeaderTab[] = [
    {
      title: translate('text_628cf761cbe6820138b8f2e4'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.overview,
      }),
      match: [
        generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
          customerId,
          tab: CustomerDetailsTabsOptions.overview,
        }),
        generatePath(CUSTOMER_DETAILS_ROUTE, { customerId }),
      ],
      content: (
        <div className="flex flex-col gap-12">
          <CustomerCoupons />
          <CustomerSubscriptionsList />
        </div>
      ),
    },
    {
      title: translate('text_62d175066d2dbf1d50bc937c'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.wallet,
      }),
      content: <CustomerWalletsList customerId={customerId} customerTimezone={safeTimezone} />,
      dataTest: 'wallet-tab',
    },
    {
      title: translate('text_6553885df387fd0097fd7384'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.usage,
      }),
      hidden: !hasPermissions(['analyticsView']),
      content: <CustomerUsage premiumWarningDialogRef={premiumWarningDialogRef} />,
    },
    {
      title: translate('text_628cf761cbe6820138b8f2e6'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.invoices,
      }),
      content: (
        <CustomerInvoicesTab
          externalId={externalId}
          userCurrency={customer?.currency || undefined}
          customerId={customerId}
          customerTimezone={safeTimezone}
          isPartner={isPartner}
        />
      ),
    },
    {
      title: translate('text_6672ebb8b1b50be550eccbed'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.payments,
      }),
      content: <CustomerPaymentsTab externalCustomerId={externalId as string} />,
    },
    {
      title: translate('text_63725b30957fd5b26b308dd3'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.creditNotes,
      }),
      hidden: !hasCreditNotes,
      content: (
        <CustomerCreditNotesList
          customerId={customerId}
          creditNotesCreditsAvailableCount={creditNotesCreditsAvailableCount}
          creditNotesBalanceAmountCents={creditNotesBalanceAmountCents}
          userCurrency={customer?.currency || undefined}
          customerTimezone={safeTimezone}
        />
      ),
    },
    {
      title: translate('text_17376404438209bh9jk7xa2s'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.information,
      }),
      content: (
        <CustomerMainInfos
          loading={loading}
          customer={customer}
          onEdit={() => navigate(generatePath(UPDATE_CUSTOMER_ROUTE, { customerId }))}
        />
      ),
    },
    {
      title: translate('text_638dff9779fb99299bee9126'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.settings,
      }),
      content: <CustomerSettings customerId={customerId} />,
      hidden: !hasPermissions(['customersView']),
    },
    {
      title: translate('text_1747314141347qq6rasuxisl'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.activityLogs,
      }),
      content: <CustomerActivityLogs externalCustomerId={externalId || ''} />,
      hidden: !externalId || !isPremium || !hasPermissions(['auditLogsView']),
    },
  ]

  return tabs
}
