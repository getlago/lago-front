import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router'

import { useCopyContractExternalId } from '~/components/contracts/useCopyContractExternalId'
import {
  getContractTerminationCopy,
  useTerminateContractDialog,
} from '~/components/contracts/useTerminateContractDialog'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { ContractDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CONTRACT_DETAILS_ROUTE, CONTRACT_DETAILS_TAB_ROUTE, CONTRACTS_ROUTE } from '~/core/router'
import {
  ContractStatusEnum,
  LagoApiError,
  useGetContractForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useContractPermissionsActions } from '~/hooks/useContractPermissionsActions'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import { ContractDetailsOverview } from './details/ContractDetailsOverview'

gql`
  fragment ContractForContractDetails on Contract {
    id
    externalId
    name
    status
    appliedRateCardsCount
    plan {
      id
      name
    }
  }

  query getContractForDetails($id: ID!) {
    contract(id: $id) {
      ...ContractForContractDetails
    }
  }
`

export const CONTRACT_DETAILS_ACTIONS_TEST_ID = 'contract-details-actions'
export const CONTRACT_DETAILS_COPY_ID_TEST_ID = 'contract-details-copy-external-id'
export const CONTRACT_DETAILS_TERMINATE_TEST_ID = 'contract-details-terminate'
export const CONTRACT_DETAILS_CANCEL_TEST_ID = 'contract-details-cancel'

const ContractDetails = (): JSX.Element => {
  const { id = '' } = useParams()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { canTerminateContract } = useContractPermissionsActions()
  const { copyContractExternalId, copyContractExternalIdLabel } = useCopyContractExternalId()
  const { openTerminateContractDialog } = useTerminateContractDialog()

  const { data, loading, error } = useGetContractForDetailsQuery({
    variables: { id },
    skip: !id,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useNotFoundRedirect({
    error,
    loading,
    notFound: !!data && !data.contract,
    redirectTo: CONTRACTS_ROUTE,
    translateKey: 'text_1789723302114t5f7dka9914',
  })

  const contract = data?.contract
  const baseDetailsPath = generatePath(CONTRACT_DETAILS_ROUTE, { id })
  const buildTabLink = (tab: ContractDetailsTabsOptionsEnum): string =>
    generatePath(CONTRACT_DETAILS_TAB_ROUTE, { id, tab })
  const overviewLink = buildTabLink(ContractDetailsTabsOptionsEnum.overview)
  const terminationCopy = contract ? getContractTerminationCopy(contract.status) : null

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: CONTRACT_DETAILS_ACTIONS_TEST_ID,
      items: contract
        ? [
            {
              label: copyContractExternalIdLabel,
              startIcon: 'duplicate',
              dataTest: CONTRACT_DETAILS_COPY_ID_TEST_ID,
              onClick: (closePopper) => {
                copyContractExternalId(contract.externalId)
                closePopper()
              },
            },
            ...(terminationCopy && canTerminateContract(contract.status)
              ? [
                  {
                    label: translate(terminationCopy.actionText),
                    startIcon: 'stop' as const,
                    danger: true,
                    dataTest:
                      contract.status === ContractStatusEnum.Pending
                        ? CONTRACT_DETAILS_CANCEL_TEST_ID
                        : CONTRACT_DETAILS_TERMINATE_TEST_ID,
                    onClick: (closePopper: () => void) => {
                      closePopper()
                      openTerminateContractDialog(contract)
                    },
                  },
                ]
              : []),
          ]
        : [],
    },
  ]

  const activeTabContent = useMainHeaderTabContent()
  const status = contractStatusMapping(contract?.status)

  return (
    <>
      <MainHeader.Configure
        snapshotKey={`${contract?.externalId}|${contract?.name}|${contract?.plan?.name}|${contract?.status}|${contract?.appliedRateCardsCount}`}
        breadcrumb={[
          { label: translate('text_17894894166553ysarr965xr'), path: CONTRACTS_ROUTE },
          { label: translate('text_17891318128636r6g9igqqeq') },
        ]}
        entity={{
          viewName: contract?.name || contract?.plan?.name || '',
          viewNameLoading: loading,
          metadata: contract?.externalId,
          metadataLoading: loading,
          badges: contract ? [status] : undefined,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: overviewLink,
            match: [baseDetailsPath, overviewLink, `${overviewLink}/:section`],
            content: (
              <DetailsPage.Container className="pt-6">
                <ContractDetailsOverview
                  rateCardsCount={contract?.appliedRateCardsCount}
                  loading={loading}
                />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1725983967306cf8dwr2r4u2'),
            link: buildTabLink(ContractDetailsTabsOptionsEnum.usage),
            content: (
              <DetailsPage.Container className="pt-6">
                <Typography>Todo</Typography>
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: buildTabLink(ContractDetailsTabsOptionsEnum.activityLogs),
            content: (
              <DetailsPage.Container className="pt-6">
                <Typography>Todo</Typography>
              </DetailsPage.Container>
            ),
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      {activeTabContent}
    </>
  )
}

export default ContractDetails
