import { gql } from '@apollo/client'

import { LocalPricingUnitType, LocalUsageChargeInput } from '~/components/plans/types'
import { addToast } from '~/core/apolloClient'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import { serializeFilters, serializeProperties } from '~/core/serializers/serializePlanInput'
import {
  CurrencyEnum,
  UpdateSubscriptionChargeInput,
  UsageChargeForDetailsV2FragmentDoc,
  useUpdateSubscriptionChargeMutation,
} from '~/generated/graphql'

gql`
  mutation updateSubscriptionCharge($input: UpdateSubscriptionChargeInput!) {
    updateSubscriptionCharge(input: $input) {
      ...UsageChargeForDetailsV2
    }
  }

  ${UsageChargeForDetailsV2FragmentDoc}
`

type Args = {
  subscriptionId: string
  currency: CurrencyEnum
}

const serializeAppliedPricingUnit = (
  appliedPricingUnit: LocalUsageChargeInput['appliedPricingUnit'],
) =>
  !appliedPricingUnit || appliedPricingUnit.type === LocalPricingUnitType.Fiat
    ? undefined
    : { conversionRate: Number(appliedPricingUnit.conversionRate) }

export const useSubscriptionChargeMutations = ({ subscriptionId, currency }: Args) => {
  const [updateSubscriptionCharge] = useUpdateSubscriptionChargeMutation({
    // First override-creating edit changes plan + charge ids; refetch the tab
    // query by operation name (the query is created in a later task; refetch by
    // name avoids importing its Document).
    refetchQueries: ['getSubscriptionForDetailsV2Plan'],
    awaitRefetchQueries: true,
    onCompleted(data) {
      if (data?.updateSubscriptionCharge?.id) {
        addToast({ severity: 'success', translateKey: 'text_1779736085470h5bm2lrvwsp' })
      }
    },
  })

  const buildInput = (charge: LocalUsageChargeInput): UpdateSubscriptionChargeInput => ({
    subscriptionId,
    chargeCode: charge.code ?? '',
    appliedPricingUnit: serializeAppliedPricingUnit(charge.appliedPricingUnit),
    invoiceDisplayName: charge.invoiceDisplayName || undefined,
    minAmountCents:
      !!charge.minAmountCents && !charge.payInAdvance
        ? Number(serializeAmount(charge.minAmountCents, currency) || 0)
        : undefined,
    taxCodes: charge.taxes?.map((t) => t.code) ?? [],
    properties: charge.properties
      ? serializeProperties(charge.properties, charge.chargeModel)
      : undefined,
    filters: serializeFilters(charge.filters, charge.chargeModel),
  })

  // index is ignored — the sub tab edits only (no create/delete).
  const handleSaveCharge = async (
    charge: LocalUsageChargeInput,
    _index: number | null,
  ): Promise<boolean> => {
    await updateSubscriptionCharge({ variables: { input: buildInput(charge) } })
    return true
  }

  // Delete is hidden on the sub tab; provide a no-op for the shared handler shape.
  const handleDeleteCharge = async (_chargeId: string): Promise<boolean> => false

  return { handleSaveCharge, handleDeleteCharge }
}
