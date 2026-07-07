import { revalidateLogic } from '@tanstack/react-form'
import { useCallback } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
import {
  walletFreeAndPaidSchema,
  type WalletFreeAndPaidSlice,
} from '~/components/wallets/tanstackForm/walletFormSchema'
import { WalletFreeAndPaidCreditsFields } from '~/components/wallets/tanstackForm/WalletFreeAndPaidCreditsFields'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const WALLET_FREE_PAID_DRAWER_SAVE_TEST_ID = 'wallet-free-paid-drawer-save'

const DEFAULTS: WalletFreeAndPaidSlice = {
  freeCredits: '',
  paidCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  metadata: [],
}

interface FreeAndPaidCtx {
  currency: CurrencyEnum
  rateAmount: string
  walletName: string
  min: string | null
  max: string | null
}

export const useWalletFreeAndPaidCreditsDrawer = (
  onSave: (values: WalletFreeAndPaidSlice) => void,
  ctx: FreeAndPaidCtx,
) => {
  const { translate } = useInternationalization()
  const drawer = useDrawer()

  const form = useAppForm({
    defaultValues: DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: walletFreeAndPaidSchema({
        rateAmount: ctx.rateAmount,
        min: ctx.min,
        max: ctx.max,
      }),
    },
    onSubmit: async ({ value }) => {
      onSave(value)
      drawer.close()
    },
  })

  const handleFormSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    form.handleSubmit()
  }

  const openDrawer = useCallback(
    (values: WalletFreeAndPaidSlice) => {
      form.reset(values, { keepDefaultValues: true })

      drawer.open({
        title: translate('text_1783352692385e6ttj3xne6k'),
        children: (
          <form onSubmit={handleFormSubmit}>
            <button type="submit" hidden tabIndex={-1} />
            <WalletFreeAndPaidCreditsFields
              form={form}
              currency={ctx.currency}
              rateAmount={ctx.rateAmount}
              walletName={ctx.walletName}
            />
          </form>
        ),
        actions: (
          <div className="flex items-center justify-end gap-3">
            <Button variant="quaternary" onClick={() => drawer.close()}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <form.Subscribe selector={({ canSubmit }) => canSubmit}>
              {(canSubmit) => (
                <Button
                  data-test={WALLET_FREE_PAID_DRAWER_SAVE_TEST_ID}
                  onClick={handleFormSubmit}
                  disabled={!canSubmit}
                >
                  {translate('text_17295436903260tlyb1gp1i7')}
                </Button>
              )}
            </form.Subscribe>
          </div>
        ),
      })
    },
    // handleFormSubmit is stable (closure over form) — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawer, form, translate, ctx.currency, ctx.rateAmount, ctx.walletName],
  )

  return { openDrawer }
}
