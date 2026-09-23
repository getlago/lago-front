import { ConnectionBehaviorEnum, ConnectionChoiceInput } from '~/generated/graphql'

/** `undefined` means the choice was never made: the category is omitted from the payload */
export type SelectedConnection = ConnectionChoiceInput | null | undefined

export enum ConnectionBehavior {
  INHERIT = 'inherit',
  SPECIFIC = 'specific',
  SKIP = 'skip',
}

export const deriveConnectionBehavior = (value?: SelectedConnection): ConnectionBehavior => {
  // A `code` key with no value yet IS the "specific" branch mid-selection: without it the radio
  // and the published value would disagree, and the schema could never flag the missing code.
  if (typeof value?.code === 'string') return ConnectionBehavior.SPECIFIC
  if (value?.behavior === ConnectionBehaviorEnum.Skip) return ConnectionBehavior.SKIP

  return ConnectionBehavior.INHERIT
}

// `BillingObjectConnections::ValidateService#validate_choice` rejects a choice carrying both
// `code` and `behavior`, and one carrying neither.
export const toConnectionChoice = (
  behavior: ConnectionBehavior,
  code: string,
): ConnectionChoiceInput => {
  if (behavior === ConnectionBehavior.SPECIFIC) return { code }
  if (behavior === ConnectionBehavior.SKIP) return { behavior: ConnectionBehaviorEnum.Skip }

  return { behavior: ConnectionBehaviorEnum.Inherit }
}
