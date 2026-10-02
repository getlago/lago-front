import { generatePath } from 'react-router'

import { useContractDrawer } from '~/components/contracts/drawers/contract/useContractDrawer'
import { useDeleteCustomerDialog } from '~/components/customers/DeleteCustomerDialog'
import { MainHeaderAction, MainHeaderDropdownItem } from '~/components/MainHeader/types'
import {
  CREATE_INVOICE_ROUTE,
  CREATE_SUBSCRIPTION,
  CREATE_WALLET_ROUTE,
  CUSTOMERS_LIST_ROUTE,
  UPDATE_CUSTOMER_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  CustomerDetailsFragment,
  FeatureFlagEnum,
  useGenerateCustomerPortalUrlMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDownloadFile } from '~/hooks/useDownloadFile'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

const CUSTOMER_ACTIONS_BUTTON_TEST_ID = 'customer-actions'

interface UseCustomerDetailsHeaderActionsParams {
  customerId: string
  customer: CustomerDetailsFragment | undefined | null
  openAddCouponToCustomerDialog: () => void
}

export function useCustomerDetailsHeaderActions({
  customerId,
  customer,
  openAddCouponToCustomerDialog,
}: UseCustomerDetailsHeaderActionsParams): MainHeaderAction[] {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { hasFeatureFlag } = useOrganizationInfos()
  const navigate = useNavigate()
  const { handleDownloadFile } = useDownloadFile()
  const { openDeleteCustomerDialog } = useDeleteCustomerDialog()
  const { openDrawer: openContractDrawer } = useContractDrawer()

  const [generatePortalUrl] = useGenerateCustomerPortalUrlMutation({
    onCompleted({ generateCustomerPortalUrl }) {
      handleDownloadFile(generateCustomerPortalUrl?.url)
    },
  })

  const { hasActiveWallet } = customer || {}
  const isProductCatalogActive = hasFeatureFlag(FeatureFlagEnum.ProductCatalog)

  const getCreateSubscriptionOrContractAction = (): MainHeaderDropdownItem => {
    if (!isProductCatalogActive) {
      return {
        label: translate('text_626162c62f790600f850b70c'),
        hidden: !hasPermissions(['subscriptionsCreate']),
        onClick: (closePopper) => {
          navigate(generatePath(CREATE_SUBSCRIPTION, { customerId }))
          closePopper()
        },
      }
    }

    return {
      label: translate('text_1789553562287qzstcfu6er0'),
      hidden: !hasPermissions(['contractsCreate']),
      onClick: (closePopper) => {
        if (customer) {
          openContractDrawer({
            customer: {
              externalId: customer.externalId,
              displayName: customer.displayName,
              applicableTimezone: customer.applicableTimezone,
              billingEntityId: customer.billingEntity.id,
            },
          })
        }
        closePopper()
      },
    }
  }

  return [
    {
      type: 'action',
      label: translate('text_641b1b19d6e64300632ca60c'),
      variant: 'inline',
      startIcon: 'outside',
      onClick: async () => {
        await generatePortalUrl({
          variables: { input: { id: customerId } },
        })
      },
    },
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: CUSTOMER_ACTIONS_BUTTON_TEST_ID,
      items: [
        getCreateSubscriptionOrContractAction(),
        {
          label: translate('text_6453819268763979024ad083'),
          hidden: !hasPermissions(['invoicesCreate']),
          dataTest: 'create-invoice-action',
          onClick: (closePopper) => {
            navigate(generatePath(CREATE_INVOICE_ROUTE, { customerId }))
            closePopper()
          },
        },
        {
          label: translate('text_628b8dc14c71840130f8d8a1'),
          hidden: !hasPermissions(['couponsAttach']),
          dataTest: 'apply-coupon-action',
          onClick: (closePopper) => {
            openAddCouponToCustomerDialog()
            closePopper()
          },
        },
        {
          label: translate('text_62d175066d2dbf1d50bc93a5'),
          hidden: !hasPermissions(['walletsCreate']),
          disabled: !!hasActiveWallet,
          onClick: (closePopper) => {
            navigate(generatePath(CREATE_WALLET_ROUTE, { customerId }))
            closePopper()
          },
        },
        {
          label: translate('text_626162c62f790600f850b718'),
          hidden: !hasPermissions(['customersUpdate']),
          onClick: (closePopper) => {
            navigate(generatePath(UPDATE_CUSTOMER_ROUTE, { customerId }))
            closePopper()
          },
        },
        {
          label: translate('text_626162c62f790600f850b726'),
          hidden: !hasPermissions(['customersDelete']),
          onClick: (closePopper) => {
            openDeleteCustomerDialog({
              onDeleted: () => navigate(CUSTOMERS_LIST_ROUTE),
              customer: customer ?? undefined,
            })
            closePopper()
          },
        },
      ],
    },
  ]
}
