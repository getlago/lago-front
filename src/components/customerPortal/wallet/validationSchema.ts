import { z } from 'zod'

// The amount field is invisible-error by design (rendered with displayErrorText={false} —
// the visible label comes from topUpAmountError instead), so only the message KEY matters.
export const walletPageTopUpErrorLabels = {
  required: 'text_1771342994699klxu2paz7g8',
} as const

// `AmountInputField`'s `beforeChangeFormatter={['positiveNumber']}` stores `number | ''` at
// runtime (parseFloat result, or '' when emptied) — see migrate-formik-to-tanstack Pattern 11.
// The original Yup schema was only `number().required('')`; combined with the Formik-era
// `amount <= 0` check baked into the submit-button disabled logic, the actual gate was
// "a positive number", so both collapse into one refine here.
export const walletPageTopUpValidationSchema = z.object({
  amount: z
    .union([z.number(), z.literal('')])
    .refine((value) => typeof value === 'number' && value > 0, {
      message: walletPageTopUpErrorLabels.required,
    }),
})

export type WalletPageTopUpFormValues = z.infer<typeof walletPageTopUpValidationSchema>
