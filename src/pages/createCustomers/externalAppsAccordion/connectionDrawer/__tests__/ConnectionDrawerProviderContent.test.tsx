import { fireEvent, render } from '@testing-library/react'
import { useEffect, useState } from 'react'

import { CustomerConnectionDrawerFormApi } from '~/components/customerConnections/CustomerConnectionDrawer'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useAppForm } from '~/hooks/forms/useAppform'

import { ConnectionDrawerProviderContent } from '../ConnectionDrawerProviderContent'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

// Payment provider code → provider type. The drawer content resolves the
// selected provider TYPE from the code via this hook (drives every branch).
const PAYMENT_PROVIDER_BY_CODE: Record<string, string> = {
  'stripe-conn': 'stripe',
  'moneyhash-conn': 'moneyhash',
  'cashfree-conn': 'cashfree',
}

jest.mock('~/pages/createCustomers/common/usePaymentProviders', () => ({
  usePaymentProviders: () => ({
    paymentProviders: undefined,
    isLoadingPaymentProviders: false,
    getPaymentProvider: (code?: string) => (code ? (PAYMENT_PROVIDER_BY_CODE[code] ?? null) : null),
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

type Values = {
  providerCode: string | undefined
  providerType: string | undefined
  externalCustomerId: string | undefined
  syncWithProvider: boolean | undefined
  subsidiaryId: string | undefined
  targetedObject: undefined
  providerPaymentMethods: Record<string, boolean> | undefined
}

const EMPTY_DEFAULTS: Values = {
  providerCode: undefined,
  providerType: undefined,
  externalCustomerId: '',
  syncWithProvider: false,
  subsidiaryId: '',
  targetedObject: undefined,
  providerPaymentMethods: {},
}

// Structural selectors: the form fields expose their `name` on the rendered
// input, and the info alert its `data-test` — no translation-key coupling.
const externalIdInput = (container: HTMLElement) =>
  container.querySelector('input[name="externalCustomerId"]') as HTMLInputElement | null
const syncCheckbox = (container: HTMLElement) =>
  container.querySelector(
    '[data-test="checkbox-syncWithProvider"] input',
  ) as HTMLInputElement | null
const infoAlert = (container: HTMLElement) =>
  container.querySelector('[data-test="alert-type-info"]')

const Harness = ({
  openedValues,
  hadInitialConnection = false,
  viaReset = false,
}: {
  openedValues: Values
  hadInitialConnection?: boolean
  viaReset?: boolean
}) => {
  // Mirrors the drawer contract: the hook's defaultValues ARE the opened
  // values (react-form re-runs formApi.update(options) on every render and
  // wipes untouched state when options.defaultValues differs from the reset
  // baseline — the drawer open sequence must keep them identical).
  const form = useAppForm({ defaultValues: openedValues })
  const [resetDone, setResetDone] = useState(!viaReset)

  useEffect(() => {
    if (!viaReset) return
    form.reset(openedValues)
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

const stripeValues = (overrides: Partial<Values> = {}): Values => ({
  ...EMPTY_DEFAULTS,
  providerCode: 'stripe-conn',
  providerType: 'stripe',
  externalCustomerId: 'cus_123',
  providerPaymentMethods: { card: true },
  ...overrides,
})

describe('ConnectionDrawerProviderContent — payment', () => {
  describe('GIVEN a stripe connection is being edited', () => {
    describe('WHEN the persisted connection is rendered', () => {
      it('THEN should render the provider customer id field and the sync checkbox', () => {
        const { container } = render(<Harness openedValues={stripeValues()} hadInitialConnection />)

        expect(externalIdInput(container)).toBeInTheDocument()
        expect(syncCheckbox(container)).toBeInTheDocument()
      })

      it('THEN should render when values arrive via form.reset (the drawer open sequence)', () => {
        const { container } = render(
          <Harness openedValues={stripeValues()} hadInitialConnection viaReset />,
        )

        expect(externalIdInput(container)).toBeInTheDocument()
        expect(syncCheckbox(container)).toBeInTheDocument()
      })

      it('THEN should lock the identity fields when the connection was persisted at load', () => {
        const { container } = render(<Harness openedValues={stripeValues()} hadInitialConnection />)

        expect(externalIdInput(container)).toBeDisabled()
        expect(syncCheckbox(container)).toBeDisabled()
      })
    })

    describe('WHEN the connection was added in the current session', () => {
      it('THEN should keep the identity fields editable', () => {
        const { container } = render(
          <Harness openedValues={stripeValues()} hadInitialConnection={false} />,
        )

        expect(externalIdInput(container)).not.toBeDisabled()
        expect(syncCheckbox(container)).not.toBeDisabled()
      })
    })

    describe('WHEN the user enables "sync with provider"', () => {
      it('THEN should clear the external customer id', () => {
        const { container } = render(
          <Harness openedValues={stripeValues()} hadInitialConnection={false} />,
        )

        expect(externalIdInput(container)).toHaveValue('cus_123')

        fireEvent.click(syncCheckbox(container) as HTMLInputElement)

        expect(externalIdInput(container)).toHaveValue('')
      })
    })
  })

  describe('GIVEN a provider that does not support external ids (cashfree)', () => {
    describe('WHEN the content is rendered', () => {
      it('THEN should not render the external id field nor the sync checkbox', () => {
        const { container } = render(
          <Harness
            openedValues={{ ...EMPTY_DEFAULTS, providerCode: 'cashfree-conn' }}
            hadInitialConnection={false}
          />,
        )

        expect(externalIdInput(container)).not.toBeInTheDocument()
        expect(syncCheckbox(container)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a moneyhash connection', () => {
    describe('WHEN the content is rendered', () => {
      it('THEN should show the moneyhash info alert', () => {
        const { container } = render(
          <Harness
            openedValues={{ ...EMPTY_DEFAULTS, providerCode: 'moneyhash-conn' }}
            hadInitialConnection={false}
          />,
        )

        expect(infoAlert(container)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no provider code is selected', () => {
    describe('WHEN the content is rendered', () => {
      it('THEN should render nothing', () => {
        const { container } = render(
          <Harness openedValues={EMPTY_DEFAULTS} hadInitialConnection={false} />,
        )

        expect(container).toBeEmptyDOMElement()
      })
    })
  })
})
