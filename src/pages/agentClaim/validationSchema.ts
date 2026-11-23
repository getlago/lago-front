import { z } from 'zod'

import { zodRequiredEmail } from '~/formValidation/zodCustoms'

export const claimSchema = z.object({
  claimCode: z.string().trim().min(1, { message: 'text_1795167825511n9ipu034f3a' }),
  email: zodRequiredEmail,
})

type ClaimFormValues = z.infer<typeof claimSchema>

export const claimDefaultValues: ClaimFormValues = { claimCode: '', email: '' }

export const verifySchema = z.object({
  verificationCode: z
    .string()
    .refine((value) => /^\d{6}$/.test(value.replace(/\s/g, '')), 'text_1795167825511qk0b9gc77ys'),
})

type VerifyFormValues = z.infer<typeof verifySchema>

export const verifyDefaultValues: VerifyFormValues = { verificationCode: '' }

export const CLAIM_CODE_ERRORS: Record<string, string> = {
  invalid_claim_code: 'text_179516782551190gw364fbe2',
}

export const EMAIL_ERRORS: Record<string, string> = {
  invalid_email_format: 'text_620bc4d4269a55014d493fc3',
}

export const VERIFICATION_CODE_ERRORS: Record<string, string> = {
  invalid_verification_code: 'text_1795167825511qe5ix55msdl',
  verification_expired: 'text_1795167825511lvpnnapmrny',
}

export const TOAST_ERROR_DETAILS: string[] = ['registration_inactive', 'enrollment_required']

export const START_SILENT_ERROR_DETAILS: string[] = [
  ...Object.keys(CLAIM_CODE_ERRORS),
  ...Object.keys(EMAIL_ERRORS),
  ...TOAST_ERROR_DETAILS,
]

export const VERIFY_SILENT_ERROR_DETAILS: string[] = [
  ...Object.keys(CLAIM_CODE_ERRORS),
  ...Object.keys(VERIFICATION_CODE_ERRORS),
  ...TOAST_ERROR_DETAILS,
]
