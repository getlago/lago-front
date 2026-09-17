import { Table, TableProps } from '~/components/designSystem/Table/Table'

import { getContractDisplayName } from './getContractDisplayName'
import { useContractTableActions } from './useContractTableActions'

export type ContractListItem = {
  id: string
  externalId: string
  name?: string | null
  plan?: { name: string } | null
}

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
