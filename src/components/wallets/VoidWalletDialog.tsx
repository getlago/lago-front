import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { useNavigate, WALLET_DETAILS_ROUTE } from '~/core/router'
import { CurrencyEnum, useCreateCustomerWalletTransactionMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { WalletDetailsTabsOptionsEnum } from '~/pages/wallet/WalletDetails'

gql`
  fragment WalletForVoidTransaction on Wallet {
    id
    currency
    rateAmount
    creditsBalance
  }
`

export const VOID_WALLET_FORM_ID = 'void-wallet-form'

type VoidWalletDialogData = {
  walletId?: string
  creditsBalance?: number
  currency?: CurrencyEnum
  rateAmount?: number
}

export const useVoidWalletDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { customerId } = useParams()
  const dataRef = useRef<VoidWalletDialogData | null>(null)
  const successRef = useRef(false)

  const [createVoidTransaction] = useCreateCustomerWalletTransactionMutation({
    onCompleted(res) {
      if (res?.createCustomerWalletTransaction) {
        successRef.current = true
        addToast({
          severity: 'success',
          translateKey: 'text_662fde6f41f3c001313057b8',
        })
      }
    },
  })

  const buildValidationSchema = () =>
    z.object({
      name: z.string(),
      voidCredits: z
        .string()
        .min(1)
        .refine((value) => {
          const parsed = Number(value)

          return !isNaN(parsed) && parsed > 0
        })
        .refine(
          (value) => {
            const parsed = Number(value)
            const balance = dataRef.current?.creditsBalance

            if (balance === undefined || balance === null) return true

            return parsed <= balance
          },
          translate('text_662fc2730f9a31fe564e9dbf', {
            balance: dataRef.current?.creditsBalance ?? 0,
          }),
        ),
    })

  const form = useAppForm({
    defaultValues: {
      name: '',
      voidCredits: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: buildValidationSchema(),
    },
    onSubmit: async ({ value }) => {
      const walletId = dataRef.current?.walletId

      if (!walletId) return

      await createVoidTransaction({
        variables: {
          input: {
            walletId,
            voidedCredits: value.voidCredits,
            name: value.name || undefined,
          },
        },
        refetchQueries: ['getCustomerWalletList', 'getWalletTransactions'],
        notifyOnNetworkStatusChange: true,
      })
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    const walletId = dataRef.current?.walletId

    if (walletId && customerId) {
      navigate(
        generatePath(WALLET_DETAILS_ROUTE, {
          walletId,
          customerId,
          tab: WalletDetailsTabsOptionsEnum.overview,
        }),
      )
    }

    return { reason: 'success' }
  }

  const openVoidWalletDialog = (data?: VoidWalletDialogData) => {
    if (!data) return

    dataRef.current = data
    form.reset()

    formDialog
      .open({
        title: translate('text_63720bd734e1344aea75b7e9'),
        description: translate('text_662fc2730f9a31fe564e9dad'),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <div className="flex flex-col gap-6 p-8">
            <form.AppField name="name">
              {(field) => (
                <field.TextInputField
                  label={translate('text_17580145853389xkffv9cs1d')}
                  placeholder={translate('text_17580145853390n3v83gao69')}
                />
              )}
            </form.AppField>

            <form.Subscribe selector={(state) => state.values.voidCredits}>
              {(voidCreditsValue) => {
                const numeric = Number(voidCreditsValue)
                const equivalent = !isNaN(numeric) ? numeric * Number(data.rateAmount ?? 0) : 0

                return (
                  <form.AppField name="voidCredits">
                    {(field) => (
                      <field.AmountInputField
                        currency={data.currency as CurrencyEnum}
                        beforeChangeFormatter={['positiveNumber']}
                        label={translate('text_662fc2730f9a31fe564e9db1')}
                        helperText={translate('text_662fc2730f9a31fe564e9dbd', {
                          credits: intlFormatNumber(equivalent, {
                            currencyDisplay: 'symbol',
                            currency: data.currency,
                          }),
                        })}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {translate('text_62e79671d23ae6ff149de94c')}
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </form.AppField>
                )
              }}
            </form.Subscribe>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton danger>
              {translate('text_63720bd734e1344aea75b7e9')}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: VOID_WALLET_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          dataRef.current = null
        }
      })
  }

  return { openVoidWalletDialog }
}
