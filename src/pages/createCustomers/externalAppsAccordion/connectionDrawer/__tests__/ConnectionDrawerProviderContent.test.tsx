import { render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'

import { CustomerConnectionDrawerFormApi } from '~/components/customerConnections/CustomerConnectionDrawer'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { ProviderTypeEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'

import { ConnectionDrawerProviderContent } from '../ConnectionDrawerProviderContent'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/pages/createCustomers/common/usePaymentProviders', () => ({
  usePaymentProviders: () => ({
    paymentProviders: undefined,
    isLoadingPaymentProviders: false,
    getPaymentProvider: (code?: string) => (code === 'stripe-conn' ? 'stripe' : null),
  }),
}))

jest.mock('~/pages/createCustomers/common/useAccountingProviders', () => ({
  useAccountingProviders: () => ({
    accountingProviders: undefined,
    isLoadingAccountProviders: false,
    getAccountingProviderFromCode: () => null,
  }),
}))

jest.mock('~/pages/createCustomers/common/useTaxProviders', () => ({
  useTaxProviders: () => ({
    taxProviders: undefined,
    isLoadingTaxProviders: false,
    getTaxProviderFromCode: () => null,
  }),
}))

jest.mock('~/pages/createCustomers/common/useCrmProviders', () => ({
  useCrmProviders: () => ({
    crmProviders: undefined,
    isLoadingCrmProviders: false,
    getCrmProviderFromCode: () => null,
  }),
}))

const EMPTY_DEFAULTS = {
  providerCode: undefined as string | undefined,
  providerType: undefined as string | undefined,
  externalCustomerId: '' as string | undefined,
  syncWithProvider: false as boolean | undefined,
  subsidiaryId: '' as string | undefined,
  targetedObject: undefined,
  providerPaymentMethods: {} as Record<string, boolean> | undefined,
}

const OPENED_VALUES = {
  ...EMPTY_DEFAULTS,
  providerCode: 'stripe-conn' as string | undefined,
  providerType: 'stripe' as string | undefined,
  externalCustomerId: 'cus_123' as string | undefined,
  providerPaymentMethods: { card: true } as Record<string, boolean> | undefined,
}

const Harness = ({
  hadInitialConnection,
  viaReset = false,
}: {
  hadInitialConnection: boolean
  viaReset?: boolean
}) => {
  // Mirrors the drawer contract: the hook's defaultValues ARE the opened
  // values (react-form re-runs formApi.update(options) on every render and
  // wipes untouched state when options.defaultValues differs from the reset
  // baseline — the drawer open sequence must keep them identical).
  const form = useAppForm({ defaultValues: OPENED_VALUES })
  const [resetDone, setResetDone] = useState(!viaReset)

  useEffect(() => {
    if (!viaReset) return
    form.reset(OPENED_VALUES)
    // Force the re-render that used to wipe the untouched form state
    setResetDone(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viaReset])

  if (!resetDone) return null

  return (
    <ConnectionDrawerProviderContent
      form={form as unknown as CustomerConnectionDrawerFormApi}
      category={ConnectionCategory.Payment}
      hadInitialConnection={hadInitialConnection}
      isCustomerEdition={true}
    />
  )
}

describe('ConnectionDrawerProviderContent — payment/stripe edit', () => {
  it('renders provider customer id field and stripe methods when editing a persisted stripe connection', () => {
    render(<Harness hadInitialConnection={true} />)

    // Payment provider customer ID field (label key) — must be visible even when disabled
    expect(screen.getByText('text_62b328ead9a4caef81cd9ca0')).toBeInTheDocument()
    // Sync checkbox (stripe default label key)
    expect(screen.getByText('text_635bdbda84c98758f9bba89e')).toBeInTheDocument()
    // Stripe payment methods section must be mounted
    expect(ProviderTypeEnum.Stripe).toBe('stripe')
  })

  it('renders the content when values arrive via form.reset (the drawer open sequence)', () => {
    render(<Harness hadInitialConnection={true} viaReset />)

    expect(screen.getByText('text_62b328ead9a4caef81cd9ca0')).toBeInTheDocument()
    expect(screen.getByText('text_635bdbda84c98758f9bba89e')).toBeInTheDocument()
  })
})
