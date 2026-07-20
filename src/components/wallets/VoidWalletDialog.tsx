import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Dialog, DialogRef } from '~/components/designSystem/Dialog'
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

// Zod v4 renders an empty message as "Invalid input" (Yup's `.required('')` had no
// visible text). Reuse the shared "required" key so the error stays invisible — the
// disabled submit button is the only feedback, matching the original behavior.
const VOID_WALLET_REQUIRED_ERROR = 'text_1771342994699klxu2paz7g8'
const VOID_WALLET_MAX_CREDITS_ERROR = 'text_662fc2730f9a31fe564e9dbf'

// The max bound depends on the wallet the dialog was opened for (creditsBalance), not
// on form values, so the schema is a factory rebuilt on every render — mirrors the
// original Yup schema, which was recreated by useFormik on every render for the same
// reason.
type VoidWalletFormValues = {
  name: string
  voidCredits: number | string
}

const getVoidWalletValidationSchema = (creditsBalance: number | undefined) =>
  z.custom<VoidWalletFormValues>().superRefine((data, ctx) => {
    const numericVoidCredits = Number(data.voidCredits)

    if (data.voidCredits === '' || isNaN(numericVoidCredits)) {
      ctx.addIssue({ code: 'custom', message: VOID_WALLET_REQUIRED_ERROR, path: ['voidCredits'] })
      return
    }

    if (typeof creditsBalance === 'number' && numericVoidCredits > creditsBalance) {
      ctx.addIssue({
        code: 'custom',
        message: VOID_WALLET_MAX_CREDITS_ERROR,
        path: ['voidCredits'],
      })
    }
  })

type WalletProps = {
  walletId?: string
  creditsBalance?: number
  currency?: CurrencyEnum
  rateAmount?: number
}

export type VoidWalletDialogRef = {
  openDialog: (props?: WalletProps) => unknown
  closeDialog: () => unknown
}

const VOID_WALLET_FORM_ID = 'void-wallet-form'

export const VOID_WALLET_NAME_FIELD_TEST_ID = 'void-wallet-name-field'
export const VOID_WALLET_CREDITS_FIELD_TEST_ID = 'void-wallet-credits-field'
export const VOID_WALLET_SUBMIT_BUTTON_TEST_ID = 'void-wallet-submit-button'
export const VOID_WALLET_CANCEL_BUTTON_TEST_ID = 'void-wallet-cancel-button'

export const VoidWalletDialog = forwardRef<VoidWalletDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const [localData, setLocalData] = useState<WalletProps | null>(null)
  const dialogRef = useRef<DialogRef>(null)
  const { customerId } = useParams()

  const [createVoidTransaction] = useCreateCustomerWalletTransactionMutation({
    onCompleted(res) {
      if (res?.createCustomerWalletTransaction) {
        addToast({
          severity: 'success',
          translateKey: 'text_662fde6f41f3c001313057b8',
        })
      }
    },
  })

  const form = useAppForm({
    defaultValues: {
      name: '',
      voidCredits: '' as number | string,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: getVoidWalletValidationSchema(localData?.creditsBalance),
    },
    onSubmit: async ({ value }) => {
      await createVoidTransaction({
        variables: {
          input: {
            walletId: localData?.walletId as string,
            voidedCredits: String(value.voidCredits),
            name: value.name || undefined,
          },
        },
        refetchQueries: ['getCustomerWalletList', 'getWalletTransactions'],
        notifyOnNetworkStatusChange: true,
      })

      dialogRef.current?.closeDialog()

      navigate(
        generatePath(WALLET_DETAILS_ROUTE, {
          walletId: localData?.walletId as string,
          customerId: customerId as string,
          tab: WalletDetailsTabsOptionsEnum.overview,
        }),
      )
    },
  })

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const canSubmit = useStore(form.store, (state) => state.canSubmit)
  const voidCredits = useStore(form.store, (state) => state.values.voidCredits)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  useImperativeHandle(ref, () => ({
    openDialog: (props) => {
      if (!props) {
        return
      }

      setLocalData(props)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_63720bd734e1344aea75b7e9')}
      description={translate('text_662fc2730f9a31fe564e9dad')}
      onClose={() => form.reset()}
      formId={VOID_WALLET_FORM_ID}
      formSubmit={handleFormSubmit}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={closeDialog}
            data-test={VOID_WALLET_CANCEL_BUTTON_TEST_ID}
          >
            {translate('text_62e79671d23ae6ff149de968')}
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            danger={canSubmit && isDirty}
            data-test={VOID_WALLET_SUBMIT_BUTTON_TEST_ID}
          >
            {translate('text_63720bd734e1344aea75b7e9')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 flex flex-col gap-6">
        <form.AppField name="name">
          {(field) => (
            <field.TextInputField
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              data-test={VOID_WALLET_NAME_FIELD_TEST_ID}
              label={translate('text_17580145853389xkffv9cs1d')}
              placeholder={translate('text_17580145853390n3v83gao69')}
            />
          )}
        </form.AppField>

        <form.AppField name="voidCredits">
          {(field) => {
            const errorMessage = field.state.meta.errors[0]?.message

            return (
              <field.AmountInputField
                currency={localData?.currency as CurrencyEnum}
                beforeChangeFormatter={['positiveNumber']}
                data-test={VOID_WALLET_CREDITS_FIELD_TEST_ID}
                label={translate('text_662fc2730f9a31fe564e9db1')}
                errorOverride={
                  errorMessage === VOID_WALLET_MAX_CREDITS_ERROR
                    ? translate(VOID_WALLET_MAX_CREDITS_ERROR, {
                        balance: localData?.creditsBalance,
                      })
                    : false
                }
                helperText={translate('text_662fc2730f9a31fe564e9dbd', {
                  credits: intlFormatNumber(
                    !isNaN(Number(voidCredits))
                      ? Number(voidCredits) * Number(localData?.rateAmount)
                      : 0,
                    {
                      currencyDisplay: 'symbol',
                      currency: localData?.currency,
                    },
                  ),
                })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {translate('text_62e79671d23ae6ff149de94c')}
                    </InputAdornment>
                  ),
                }}
              />
            )
          }}
        </form.AppField>
      </div>
    </Dialog>
  )
})

VoidWalletDialog.displayName = 'VoidWalletDialog'
