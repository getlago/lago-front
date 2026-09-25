import { gql } from '@apollo/client'

import { Table, TableProps } from '~/components/designSystem/Table/Table'
import {
  ContractForContractDrawerFragmentDoc,
  ContractForContractsListItemFragment,
} from '~/generated/graphql'

import { getContractDisplayName } from './getContractDisplayName'
import { useContractTableActions } from './useContractTableActions'

gql`
  fragment ContractForContractsListItem on Contract {
    id
    ...ContractForContractDrawer
  }

  ${ContractForContractDrawerFragmentDoc}
`

export type ContractListItem = ContractForContractsListItemFragment

interface ContractsListProps<T extends ContractListItem> extends Omit<
  TableProps<T>,
  'actionColumn' | 'actionColumnTooltip' | 'data' | 'rowDataTestId' | 'rowLinkLabel'
> {
  contracts: T[]
}

export const ContractsList = <T extends ContractListItem>({
  contracts,
  ...tableProps
}: ContractsListProps<T>): JSX.Element => {
  const { getContractTableActions, contractTableActionsTooltip } = useContractTableActions()

  return (
    <Table
      {...tableProps}
      data={contracts}
      rowDataTestId={(contract) => getContractDisplayName(contract) || `contract-${contract.id}`}
      rowLinkLabel={getContractDisplayName}
      actionColumnTooltip={() => contractTableActionsTooltip}
      actionColumn={getContractTableActions}
    />
  )
}

ContractsList.displayName = 'ContractsList'
