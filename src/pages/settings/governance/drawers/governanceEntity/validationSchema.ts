import { z } from 'zod'

import { CreateUsageAttributionTypeInput, UsageAttributionTypeRoleEnum } from '~/generated/graphql'

export const MAX_ATTRIBUTION_KEYS = 4

const MAX_TEXT_LENGTH = 255
const REQUIRED_MESSAGE = 'text_624ea7c29103fd010732ab7d'
const TOO_LONG_MESSAGE = 'text_6453819268763979024ad029'
const TOO_MANY_KEYS_MESSAGE = 'text_17902368288440zi147lq15l'

type AttributionKeyOption = { value: string }

const getAttributionKeysError = (keys: AttributionKeyOption[]): string | undefined => {
  if (!keys.length) return REQUIRED_MESSAGE
  if (keys.length > MAX_ATTRIBUTION_KEYS) return TOO_MANY_KEYS_MESSAGE
  if (keys.some(({ value }) => !value.trim())) return REQUIRED_MESSAGE
  if (keys.some(({ value }) => value.trim().length > MAX_TEXT_LENGTH)) return TOO_LONG_MESSAGE

  return undefined
}

export const governanceEntityValidationSchema = z.object({
  name: z.string().max(MAX_TEXT_LENGTH, { message: TOO_LONG_MESSAGE }),
  code: z
    .string()
    .min(1, { message: REQUIRED_MESSAGE })
    .max(MAX_TEXT_LENGTH, { message: TOO_LONG_MESSAGE }),
  role: z
    .enum(UsageAttributionTypeRoleEnum)
    .optional()
    .refine((role) => !!role, { message: REQUIRED_MESSAGE }),
  parentId: z.string().optional(),
  attributionKeys: z.array(z.looseObject({ value: z.string() })).superRefine((keys, ctx) => {
    const message = getAttributionKeysError(keys)

    if (message) ctx.addIssue({ code: 'custom', message })
  }),
})

export type GovernanceEntityFormValues = z.input<typeof governanceEntityValidationSchema>

export const GOVERNANCE_ENTITY_FORM_DEFAULTS: GovernanceEntityFormValues = {
  name: '',
  code: '',
  role: undefined,
  parentId: undefined,
  attributionKeys: [],
}

export const buildCreateUsageAttributionTypeInput = (
  values: GovernanceEntityFormValues,
): CreateUsageAttributionTypeInput | undefined => {
  if (!values.role) return undefined

  const isHierarchical = values.role === UsageAttributionTypeRoleEnum.Hierarchical

  return {
    ...(values.name ? { name: values.name } : {}),
    code: values.code,
    role: values.role,
    attributionKeys: values.attributionKeys.map(({ value }) => value.trim()),
    ...(isHierarchical && values.parentId ? { parentId: values.parentId } : {}),
  }
}
