import { revalidateLogic } from '@tanstack/react-form'
import { useCallback } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
import {
  walletScopeSchema,
  type WalletScopeSlice,
} from '~/components/wallets/tanstackForm/walletFormSchema'
import { WalletScopeFields } from '~/components/wallets/tanstackForm/WalletScopeFields'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const WALLET_SCOPE_DRAWER_SAVE_TEST_ID = 'wallet-scope-drawer-save'

const DEFAULTS: WalletScopeSlice = { feeTypes: [], billableMetricCodes: [] }

export const useWalletScopeDrawer = (onSave: (values: WalletScopeSlice) => void) => {
  const { translate } = useInternationalization()
  const drawer = useDrawer()

  const form = useAppForm({
    defaultValues: DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: walletScopeSchema },
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
    (values: WalletScopeSlice) => {
      form.reset(values, { keepDefaultValues: true })

      drawer.open({
        title: translate('text_178335269238576yarvlompv'),
        children: (
          <form onSubmit={handleFormSubmit}>
            <button type="submit" hidden tabIndex={-1} />
            <WalletScopeFields form={form} />
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
                  data-test={WALLET_SCOPE_DRAWER_SAVE_TEST_ID}
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
    [drawer, form, translate],
  )

  return { openDrawer }
}
