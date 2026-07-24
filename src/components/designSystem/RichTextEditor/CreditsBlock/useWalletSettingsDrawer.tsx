import { revalidateLogic } from '@tanstack/react-form'
import { useCallback } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
import {
  itemToSettings,
  walletSettingsSchema,
  type WalletSettingsSlice,
} from '~/components/wallets/tanstackForm/walletFormSchema'
import { WalletSettingsFields } from '~/components/wallets/tanstackForm/WalletSettingsFields'
import { makeEmptyWalletItem } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const WALLET_SETTINGS_DRAWER_SAVE_TEST_ID = 'wallet-settings-drawer-save'

const DEFAULTS: WalletSettingsSlice = itemToSettings(makeEmptyWalletItem(''))

export const useWalletSettingsDrawer = (
  onSave: (values: WalletSettingsSlice) => void,
  currency: CurrencyEnum,
) => {
  const { translate } = useInternationalization()
  const drawer = useDrawer()

  const form = useAppForm({
    defaultValues: DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: walletSettingsSchema },
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
    (values: WalletSettingsSlice) => {
      form.reset(values, { keepDefaultValues: true })

      drawer.open({
        title: translate('text_17833526923851igosmn1oar'),
        children: (
          <form onSubmit={handleFormSubmit}>
            <button type="submit" hidden tabIndex={-1} />
            <WalletSettingsFields form={form} lockedCurrency={currency} initialValues={values} />
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
                  data-test={WALLET_SETTINGS_DRAWER_SAVE_TEST_ID}
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
    [drawer, form, translate, currency],
  )

  return { openDrawer }
}
