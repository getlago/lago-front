import { ContractStatusEnum } from '~/generated/graphql'
import { usePermissions } from '~/hooks/usePermissions'

export const useContractPermissionsActions = () => {
  const { hasPermissions } = usePermissions()

  const isStatusTerminable = (status: ContractStatusEnum | null | undefined): boolean => {
    if (!status) return false

    return status === ContractStatusEnum.Active || status === ContractStatusEnum.Pending
  }

  const canTerminateContract = (status: ContractStatusEnum | null | undefined): boolean => {
    return hasPermissions(['contractsUpdate']) && isStatusTerminable(status)
  }

  return {
    isStatusTerminable,
    canTerminateContract,
  }
}
