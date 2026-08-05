import { revalidateLogic } from '@tanstack/react-form'
import { useCallback } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
import {
  itemToRecurring,
  walletRecurringSchema,
  type WalletRecurringSlice,
} from '~/components/wallets/tanstackForm/walletFormSchema'
import { WalletRecurringTopUpFields } from '~/components/wallets/tanstackForm/WalletRecurringTopUpFields'
import { makeEmptyWalletItem } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const WALLET_RECURRING_DRAWER_SAVE_TEST_ID = 'wallet-recurring-drawer-save'

const DEFAULTS: WalletRecurringSlice = itemToRecurring(makeEmptyWalletItem(''))

export const useWalletRecurringTopUpDrawer = (
  onSave: (values: WalletRecurringSlice) => void,
  ctx: { currency: CurrencyEnum; rateAmount?: string },
) => {
  const { translate } = useInternationalization()
  const drawer = useDrawer()

  const form = useAppForm({
    defaultValues: DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: walletRecurringSchema() },
    onSubmit: async ({ value }) => {
      // Opening this drawer and saving implies the user wants a recurring rule.
      onSave({ ...value, enabled: true })
      drawer.close()
    },
  })

  const handleFormSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    form.handleSubmit()
  }

  const openDrawer = useCallback(
    (values: WalletRecurringSlice) => {
      form.reset({ ...values, enabled: true }, { keepDefaultValues: true })

      drawer.open({
        title: translate('text_1783352692385mulfe6vb211'),
        children: (
          <form onSubmit={handleFormSubmit}>
            <button type="submit" hidden tabIndex={-1} />
            <WalletRecurringTopUpFields
              form={form}
              currency={ctx.currency}
              rateAmount={ctx.rateAmount ?? '1'}
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
                  data-test={WALLET_RECURRING_DRAWER_SAVE_TEST_ID}
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
    [drawer, form, translate, ctx.currency, ctx.rateAmount],
  )

  return { openDrawer }
}
