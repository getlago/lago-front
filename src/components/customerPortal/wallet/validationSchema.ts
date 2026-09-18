import { z } from 'zod'

const REQUIRED_FIELD_MESSAGE = 'text_1771342994699klxu2paz7g8'

export const walletPageTopUpValidationSchema = z.object({
  amount: z.string().refine((value) => Number(value) > 0, {
    message: REQUIRED_FIELD_MESSAGE,
  }),
})

export type WalletPageTopUpFormValues = z.infer<typeof walletPageTopUpValidationSchema>

export const walletPageTopUpDefaultValues: WalletPageTopUpFormValues = {
  amount: '',
}
