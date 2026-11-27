import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router'

import { useDeleteAlertDialog } from '~/components/alerts/DeleteAlertDialog'
import { AppliedRateCardDetailsPlaceholder } from '~/components/appliedRateCards/details/AppliedRateCardDetailsPlaceholder'
import { useContractAlertDrawer } from '~/components/contracts/drawers/contractAlert/useContractAlertDrawer'
import { getContractDisplayName } from '~/components/contracts/getContractDisplayName'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { ContractOverviewSectionsEnum } from '~/core/constants/tabsOptions'
import {
  CONTRACT_ALERT_DETAILS_ROUTE,
  CONTRACT_DETAILS_SECTION_ROUTE,
  CONTRACTS_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  ContractAlertForDetailsFragment,
  ContractAlertForDrawerFragmentDoc,
  ContractForContractAlertDetailsFragment,
  LagoApiError,
  useGetContractAlertForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import { ContractAlertDetailsOverview } from './ContractAlertDetailsOverview'
import { isContractAlertsReadOnly } from './ContractAlertsSection'

gql`
  fragment ContractAlertForDetails on ContractAlert {
    id
    contractExternalId
    ...ContractAlertForDrawer
  }

  fragment ContractForContractAlertDetails on Contract {
    id
    name
    externalId
    currency
    status
    plan {
      id
      name
    }
  }

  query getContractAlertForDetails($alertId: ID!, $contractId: ID!) {
    contractAlert(id: $alertId) {
      id
      ...ContractAlertForDetails
    }
    contract(id: $contractId) {
      id
      ...ContractForContractAlertDetails
    }
  }

  ${ContractAlertForDrawerFragmentDoc}
`

export const CONTRACT_ALERT_DETAILS_ACTIONS_TEST_ID = 'contract-alert-details-actions'
export const CONTRACT_ALERT_DETAILS_EDIT_TEST_ID = 'contract-alert-details-edit'
export const CONTRACT_ALERT_DETAILS_DELETE_TEST_ID = 'contract-alert-details-delete'
const CONTRACT_ALERT_DETAILS_OVERVIEW_TAB_TEST_ID = 'contract-alert-details-overview-tab'

const ALERT_NOT_FOUND_TRANSLATION_KEY = 'text_1737477631498hwm4np3kbnd'
const CONTRACT_NOT_FOUND_TRANSLATION_KEY = 'text_1789723302114t5f7dka9914'
const ALERT_BREADCRUMB_TRANSLATION_KEY = 'text_1795788761951w6wez7qaamp'

const buildAlertsSectionPath = (contractId: string): string =>
  generatePath(CONTRACT_DETAILS_SECTION_ROUTE, {
    id: contractId,
    section: ContractOverviewSectionsEnum.alerts,
  })

type ContractAlertDetailsContentProps = {
  alert: ContractAlertForDetailsFragment
  contract: ContractForContractAlertDetailsFragment
}

const ContractAlertDetailsContent = ({
  alert,
  contract,
}: ContractAlertDetailsContentProps): JSX.Element => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDrawer } = useContractAlertDrawer()
  const { openDeleteAlertDialog } = useDeleteAlertDialog()
  const activeTabContent = useMainHeaderTabContent()

  const alertsSectionPath = buildAlertsSectionPath(contract.id)
  const alertPath = generatePath(CONTRACT_ALERT_DETAILS_ROUTE, {
    id: contract.id,
    alertId: alert.id,
  })
  const canUpdateAlert = isPremium && hasPermissions(['contractsUpdate'])

  return (
    <>
      <MainHeader.Configure
        snapshotKey={JSON.stringify({ alert, contract })}
        breadcrumb={[
          { label: translate('text_17894894166553ysarr965xr'), path: CONTRACTS_ROUTE },
          { label: getContractDisplayName(contract), path: alertsSectionPath },
          { label: translate(ALERT_BREADCRUMB_TRANSLATION_KEY) },
        ]}
        entity={{ viewName: alert.name || '-', metadata: alert.code }}
        actions={{
          items: [
            {
              type: 'dropdown',
              label: translate('text_626162c62f790600f850b6fe'),
              dataTest: CONTRACT_ALERT_DETAILS_ACTIONS_TEST_ID,
              items: [
                {
                  label: translate('text_1746546924392wfvshvfrjos'),
                  dataTest: CONTRACT_ALERT_DETAILS_EDIT_TEST_ID,
                  hidden: !canUpdateAlert || isContractAlertsReadOnly(contract.status),
                  onClick: (closePopper) => {
                    openDrawer({ contractId: contract.id, currency: contract.currency, alert })
                    closePopper()
                  },
                },
                {
                  label: translate('text_17465469243924wwxl5pgoxi'),
                  dataTest: CONTRACT_ALERT_DETAILS_DELETE_TEST_ID,
                  hidden: !canUpdateAlert,
                  onClick: (closePopper) => {
                    openDeleteAlertDialog({
                      alertKind: 'contract',
                      id: alert.id,
                      onDeleted: () => navigate(alertsSectionPath),
                    })
                    closePopper()
                  },
                },
              ],
            },
          ],
        }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: alertPath,
            match: [alertPath],
            dataTest: CONTRACT_ALERT_DETAILS_OVERVIEW_TAB_TEST_ID,
            content: (
              <DetailsPage.Container className="pt-12">
                <ContractAlertDetailsOverview alert={alert} currency={contract.currency} />
              </DetailsPage.Container>
            ),
          },
        ]}
      />

      {activeTabContent}
    </>
  )
}

const ContractAlertDetails = (): JSX.Element | null => {
  const { id = '', alertId = '' } = useParams()

  const { data, loading, error } = useGetContractAlertForDetailsQuery({
    variables: { alertId, contractId: id },
    skip: !alertId || !id,
    errorPolicy: 'all',
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const contract = data?.contract
  const alert = data?.contractAlert
  const isMismatch =
    !!data && !error && (!contract || !alert || alert.contractExternalId !== contract.externalId)

  useNotFoundRedirect({
    error,
    loading,
    notFound: isMismatch,
    redirectTo: contract ? buildAlertsSectionPath(contract.id) : CONTRACTS_ROUTE,
    translateKey: contract ? ALERT_NOT_FOUND_TRANSLATION_KEY : CONTRACT_NOT_FOUND_TRANSLATION_KEY,
  })

  if (isMismatch || hasDefinedGQLError('NotFound', error)) return null

  if (alert && contract) return <ContractAlertDetailsContent alert={alert} contract={contract} />

  return (
    <AppliedRateCardDetailsPlaceholder
      context="contract"
      loading={loading && !data}
      hasError={!!error}
      lastCrumbLabelKey={ALERT_BREADCRUMB_TRANSLATION_KEY}
    />
  )
}

export default ContractAlertDetails
