import { z } from 'zod'

const REQUIRED_FIELD_MESSAGE = 'text_1771342994699klxu2paz7g8'

// AmountInputField stores a number for zero-decimal currencies and a string
// for currencies with decimal precision. An empty field is stored as ''.
export const walletPageTopUpValidationSchema = z.object({
  amount: z.union([z.string(), z.number()]).refine((value) => Number(value) > 0, {
    message: REQUIRED_FIELD_MESSAGE,
  }),
})

export type WalletPageTopUpFormValues = z.infer<typeof walletPageTopUpValidationSchema>

export const walletPageTopUpDefaultValues: WalletPageTopUpFormValues = {
  amount: '',
}
