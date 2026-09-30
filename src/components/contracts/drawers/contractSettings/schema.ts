import { z } from 'zod'

import { addContractDateAndPurchaseOrderIssues } from '~/components/contracts/drawers/contract/schema'

import { ContractSettingsFormValues } from './constants'

export const contractSettingsSchema = z
  .custom<ContractSettingsFormValues>()
  .superRefine((data, ctx) => {
    addContractDateAndPurchaseOrderIssues(ctx, data)
  })
