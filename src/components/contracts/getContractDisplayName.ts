type ContractWithDisplayName = {
  name?: string | null
  plan?: {
    name: string
  } | null
}

export const getContractDisplayName = (contract: ContractWithDisplayName): string =>
  contract.name || contract.plan?.name || ''
