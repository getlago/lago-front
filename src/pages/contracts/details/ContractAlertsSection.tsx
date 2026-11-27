import { gql } from '@apollo/client'

import { useDeleteAlertDialog } from '~/components/alerts/DeleteAlertDialog'
import { PaginatedContent } from '~/components/designSystem/Pagination/PaginatedContent'
import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { Table } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ContractAlertForAlertsSectionFragment,
  ContractStatusEnum,
  useGetContractAlertsForAlertsSectionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment ContractAlertForAlertsSection on ContractAlert {
    id
    name
    code
  }

  query getContractAlertsForAlertsSection($contractId: ID!, $page: Int, $limit: Int) {
    contractAlerts(contractId: $contractId, page: $page, limit: $limit) {
      collection {
        ...ContractAlertForAlertsSection
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

export const CONTRACT_ALERTS_SECTION_TEST_ID = 'contract-alerts-section'
export const CONTRACT_ALERTS_PREMIUM_GATE_TEST_ID = 'contract-alerts-premium-gate'
export const CONTRACT_ALERTS_ADD_ALERT_TEST_ID = 'contract-alerts-add-alert'
export const CONTRACT_ALERTS_EDIT_ACTION_TEST_ID = 'contract-alerts-edit-action'
export const CONTRACT_ALERTS_DELETE_ACTION_TEST_ID = 'contract-alerts-delete-action'

const READ_ONLY_CONTRACT_STATUSES = [ContractStatusEnum.Terminated, ContractStatusEnum.Canceled]

export const isContractAlertsReadOnly = (status?: ContractStatusEnum): boolean =>
  !status || READ_ONLY_CONTRACT_STATUSES.includes(status)

type ContractAlertsSectionProps = {
  contractId: string
  isReadOnly: boolean
}

export const ContractAlertsSection = ({
  contractId,
  isReadOnly,
}: ContractAlertsSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDeleteAlertDialog } = useDeleteAlertDialog()
  const { page, goToPage } = usePageSearchParam()
  const canUpdateAlerts = hasPermissions(['contractsUpdate'])

  const { data, loading, error } = useGetContractAlertsForAlertsSectionQuery({
    variables: { contractId, page, limit: DEFAULT_PAGE_SIZE },
    skip: !isPremium || !contractId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
  })

  const placeholder = buildSearchAwareTablePlaceholder({
    translate,
    hasSearchTerm: false,
    noResultTitleKey: 'text_1795702994442lrhuqa6ghhj',
    emptyTitleKey: 'text_1795702994442lrhuqa6ghhj',
    emptySubtitleKey: 'text_17957029944424sxnh050euf',
  })

  const getRowActions = (
    alert: ContractAlertForAlertsSectionFragment,
  ): Array<ActionItem<ContractAlertForAlertsSectionFragment> | null> => {
    if (!canUpdateAlerts) return []

    return [
      isReadOnly
        ? null
        : {
            title: translate('text_1746546924392wfvshvfrjos'),
            startIcon: 'pen',
            dataTest: CONTRACT_ALERTS_EDIT_ACTION_TEST_ID,
            onAction: () => undefined,
          },
      {
        title: translate('text_17465469243924wwxl5pgoxi'),
        startIcon: 'trash',
        dataTest: CONTRACT_ALERTS_DELETE_ACTION_TEST_ID,
        onAction: () => openDeleteAlertDialog({ alertKind: 'contract', id: alert.id }),
      },
    ]
  }

  const renderContent = (): JSX.Element => {
    if (!isPremium) {
      return (
        <PremiumFeature
          title={translate('text_1795702994442p3vvyfr6njx')}
          description={translate('text_1746523849026ljzi79afhmc')}
          feature={translate('text_17465238490269pahbvl3s2m')}
          data-test={CONTRACT_ALERTS_PREMIUM_GATE_TEST_ID}
        />
      )
    }

    return (
      <div>
        <PaginatedContent
          metadata={data?.contractAlerts?.metadata}
          loading={loading}
          onPageChange={goToPage}
        >
          <Table
            name="contract-alerts"
            data={data?.contractAlerts?.collection ?? []}
            isLoading={loading}
            hasError={!!error}
            placeholder={placeholder}
            containerSize={0}
            containerClassName="h-auto shrink-0 -mb-px"
            rowSize={72}
            columns={[
              {
                key: 'name',
                maxSpace: true,
                minWidth: 200,
                title: translate('text_6419c64eace749372fc72b0f'),
                content: ({ name, code }) => (
                  <div className="flex flex-col">
                    <Typography variant="bodyHl" color="grey700" noWrap>
                      {name || '-'}
                    </Typography>
                    <Typography variant="caption" color="grey600" noWrap>
                      {code}
                    </Typography>
                  </div>
                ),
              },
            ]}
            actionColumnTooltip={() => translate('text_6256de3bba111e00b3bfa51b')}
            actionColumn={getRowActions}
          />
        </PaginatedContent>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-6" data-test={CONTRACT_ALERTS_SECTION_TEST_ID}>
      <SectionHeader
        title={translate('text_17465238490269pahbvl3s2m')}
        description={translate('text_1795702994442gdk6vkd25gr')}
        contentClassName="gap-2"
        action={{
          label: translate('text_1795702994442o415rqxuz0p'),
          startIcon: 'plus',
          dataTest: CONTRACT_ALERTS_ADD_ALERT_TEST_ID,
          hidden: !isPremium || !canUpdateAlerts || isReadOnly,
          onClick: () => undefined,
        }}
      />

      {renderContent()}
    </section>
  )
}
