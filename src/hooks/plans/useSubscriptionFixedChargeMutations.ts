import { gql } from '@apollo/client'

import { LocalFixedChargeInput } from '~/components/plans/types'
import { addToast } from '~/core/apolloClient'
import { serializeFixedChargeProperties } from '~/core/serializers/serializePlanInput'
import {
  FixedChargeForDetailsV2FragmentDoc,
  UpdateSubscriptionFixedChargeInput,
  useUpdateSubscriptionFixedChargeMutation,
} from '~/generated/graphql'

gql`
  mutation updateSubscriptionFixedCharge($input: UpdateSubscriptionFixedChargeInput!) {
    updateSubscriptionFixedCharge(input: $input) {
      ...FixedChargeForDetailsV2
    }
  }

  ${FixedChargeForDetailsV2FragmentDoc}
`

type Args = { subscriptionId: string }

export const useSubscriptionFixedChargeMutations = ({ subscriptionId }: Args) => {
  const [updateSubscriptionFixedCharge] = useUpdateSubscriptionFixedChargeMutation({
    refetchQueries: ['getSubscriptionForDetailsV2Plan'],
    awaitRefetchQueries: true,
    onCompleted(data) {
      if (data?.updateSubscriptionFixedCharge?.id) {
        addToast({ severity: 'success', translateKey: 'text_1779477955768pjf35u2m3ac' })
      }
    },
  })

  const buildInput = (charge: LocalFixedChargeInput): UpdateSubscriptionFixedChargeInput => ({
    subscriptionId,
    fixedChargeCode: charge.code ?? '',
    invoiceDisplayName: charge.invoiceDisplayName || undefined,
    properties: charge.properties
      ? serializeFixedChargeProperties(charge.properties, charge.chargeModel)
      : undefined,
    units: charge.units ? String(charge.units) : '0',
    taxCodes: charge.taxes?.map((t) => t.code) ?? [],
    applyUnitsImmediately: charge.applyUnitsImmediately ?? false,
  })

  // Sub tab edits only (no create/delete), so the shared handler's index arg is
  // unused here — a narrower-arity fn stays assignable to FixedChargeMutations.
  const handleSaveCharge = async (charge: LocalFixedChargeInput): Promise<boolean> => {
    // Report success only when the mutation actually returned a charge. On error
    // (e.g. a 500, surfaced as a resolved result with `data: null` by the error
    // link) return false so the drawer stays open and the user can re-submit.
    const { data } = await updateSubscriptionFixedCharge({
      variables: { input: buildInput(charge) },
    })

    return !!data?.updateSubscriptionFixedCharge?.id
  }

  // Delete is hidden on the sub tab; no-op to satisfy the shared handler shape.
  const handleDeleteCharge = async (): Promise<boolean> => false

  return { handleSaveCharge, handleDeleteCharge }
}
