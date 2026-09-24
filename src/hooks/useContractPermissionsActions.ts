import { ContractStatusEnum } from '~/generated/graphql'
import { usePermissions } from '~/hooks/usePermissions'

const isLiveStatus = (status: ContractStatusEnum | null | undefined): boolean =>
  status === ContractStatusEnum.Active || status === ContractStatusEnum.Pending

export const useContractPermissionsActions = () => {
  const { hasPermissions } = usePermissions()

  const isStatusTerminable = (status: ContractStatusEnum | null | undefined): boolean =>
    isLiveStatus(status)

  const canTerminateContract = (status: ContractStatusEnum | null | undefined): boolean => {
    return hasPermissions(['contractsTerminate']) && isStatusTerminable(status)
  }

  const canEditContract = (status: ContractStatusEnum | null | undefined): boolean => {
    return hasPermissions(['contractsUpdate']) && isLiveStatus(status)
  }

  return {
    isStatusTerminable,
    canTerminateContract,
    canEditContract,
  }
}
