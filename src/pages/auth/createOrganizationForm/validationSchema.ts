import { z } from 'zod'

import { SignupRoleEnum, SignupSourceEnum } from '~/generated/graphql'

export const CREATE_ORGANIZATION_NAME_ERRORS = {
  REQUIRED: 'text_620bc4d4269a55014d493f4d',
  TOO_LONG: 'text_1794312349027nrjsvode306',
  CONTAINS_LINK: 'text_1794312349311o9gd54k4105',
} as const

const NAME_MAX_LENGTH = 100

export const createOrganizationValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: CREATE_ORGANIZATION_NAME_ERRORS.REQUIRED, abort: true })
    .refine((value) => [...value].length <= NAME_MAX_LENGTH, {
      message: CREATE_ORGANIZATION_NAME_ERRORS.TOO_LONG,
    }),
  role: z.enum(SignupRoleEnum).optional(),
  source: z.enum(SignupSourceEnum).optional(),
})

type CreateOrganizationFormValues = z.input<typeof createOrganizationValidationSchema>

const getOrganizationNameFromEmail = (email: string): string => {
  const domainLabel = email.split('@')[1]?.split('.')[0] ?? ''

  return domainLabel.charAt(0).toUpperCase() + domainLabel.slice(1)
}

export const getCreateOrganizationDefaultValues = (
  email: string | undefined,
): CreateOrganizationFormValues => ({
  name: getOrganizationNameFromEmail(email ?? ''),
  role: undefined,
  source: undefined,
})
