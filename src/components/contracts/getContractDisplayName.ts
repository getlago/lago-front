type ContractWithDisplayName = {
  name?: string | null
  externalId: string
  plan?: {
    name: string
  } | null
}

export const getContractDisplayName = (contract: ContractWithDisplayName): string =>
  contract.name || contract.plan?.name || contract.externalId
