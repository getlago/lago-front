import { ComponentProps } from 'react'

import { SelectedConnection } from '~/components/connectionSelection/types'
import { ConnectionPaymentSettingsSelector } from '~/components/paymentSettings/connectionFirst/ConnectionPaymentSettingsSelector'
import { ConnectionBehaviorEnum, PaymentMethodTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { SelectedPaymentMethod } from '../../../paymentMethodSelection/types'
import { PaymentSettingsSection } from '../PaymentSettingsSection'

let mockMultiConnection = false
const mockConnectionSelector = jest.fn<
  null,
  [ComponentProps<typeof ConnectionPaymentSettingsSelector>]
>()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ hasFeatureFlag: () => mockMultiConnection }),
}))

jest.mock('~/components/paymentSettings/connectionFirst/ConnectionPaymentSettingsSelector', () => ({
  ConnectionPaymentSettingsSelector: (
    props: ComponentProps<typeof ConnectionPaymentSettingsSelector>,
  ) => {
    mockConnectionSelector(props)
    return null
  },
}))

const mockSelector: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockDrawer: jest.Mock<null, [Record<string, unknown>]> = jest.fn()

jest.mock('~/components/designSystem/Selector', () => ({
  Selector: (props: Record<string, unknown>) => {
    mockSelector(props)

    return null
  },
}))

jest.mock('~/components/paymentSettings/PaymentSettingsDrawer', () => ({
  PaymentSettingsDrawer: function MockPaymentSettingsDrawer(props: Record<string, unknown>) {
    mockDrawer(props)

    return null
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => jest.requireActual('../../../../../translations/base.json')[key],
  }),
}))

jest.mock('@tanstack/react-form', () => ({
  revalidateLogic: jest.fn(() => ({})),
  useStore: (store: { state: unknown }, selector: (state: unknown) => unknown) =>
    selector(store.state),
}))

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: jest.fn(),
  withForm: jest.fn(
    ({
      render: RenderComponent,
      props: defaultProps,
    }: {
      render: React.FC<Record<string, unknown>>
      defaultValues: Record<string, unknown>
      props: Record<string, unknown>
    }) => {
      const WithFormWrapper = (receivedProps: Record<string, unknown>) => (
        <RenderComponent {...defaultProps} {...receivedProps} />
      )

      WithFormWrapper.displayName = 'WithFormWrapper'

      return WithFormWrapper
    },
  ),
}))

const renderSection = (
  paymentMethod?: SelectedPaymentMethod,
  externalCustomerId = 'ext-1',
  paymentConnection?: SelectedConnection,
) => {
  const state = { values: { paymentMethod, paymentConnection } }
  const form = { setFieldValue: jest.fn(), state, store: { state } }

  const props = { form, externalCustomerId, customerId: 'customer-1' }

  render(
    // @ts-expect-error - mock form shape
    <PaymentSettingsSection {...props} />,
  )

  return { form }
}

const lastSubtitle = () =>
  (mockSelector.mock.calls.at(-1)?.[0] as { subtitle?: string } | undefined)?.subtitle

describe('PaymentSettingsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMultiConnection = false
  })

  describe('GIVEN multi_connection is enabled', () => {
    it('THEN should describe the selected connection default without claiming the customer default', () => {
      mockMultiConnection = true
      renderSection(
        { paymentMethodType: PaymentMethodTypeEnum.Provider, paymentMethodId: null },
        'ext-1',
        { code: 'stripe_secondary' },
      )
      expect(mockConnectionSelector.mock.calls.at(-1)?.[0].paymentMethodSummary).toBe(
        'Use default payment method',
      )
    })

    it('THEN should seed both choices using the internal customer id', () => {
      mockMultiConnection = true
      const paymentMethod = {
        paymentMethodId: 'pm_1',
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      }

      renderSection(paymentMethod, 'ext-1', { code: 'stripe_eu' })
      expect(mockConnectionSelector).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-1',
          connection: { code: 'stripe_eu' },
          paymentMethod,
          paymentMethodSummary: expect.any(String),
        }),
      )
      expect(mockDrawer).not.toHaveBeenCalled()
      expect(mockSelector).not.toHaveBeenCalled()
    })

    it.each([
      { code: 'stripe_eu' },
      { behavior: ConnectionBehaviorEnum.Inherit },
      { behavior: ConnectionBehaviorEnum.Skip },
    ])('THEN should save connection %j and its method together', (connection) => {
      mockMultiConnection = true
      const { form } = renderSection()
      const paymentMethod = {
        paymentMethodType: PaymentMethodTypeEnum.Manual,
        paymentMethodId: null,
      }

      mockConnectionSelector.mock.calls.at(-1)?.[0].onChange({ connection, paymentMethod })
      expect(form.setFieldValue).toHaveBeenCalledWith('paymentConnection', connection)
      expect(form.setFieldValue).toHaveBeenCalledWith('paymentMethod', paymentMethod)
    })
  })

  it('THEN should retain the legacy selector when the flag is disabled', () => {
    mockMultiConnection = false
    renderSection(undefined, 'ext-1', { code: 'stripe_eu' })
    expect(mockConnectionSelector).not.toHaveBeenCalled()
    expect(mockDrawer).toHaveBeenCalled()
  })

  it('summarises the fallback (customer default) behaviour', () => {
    renderSection(undefined)

    expect(lastSubtitle()).toBe('Use customer default payment method')
  })

  it('summarises a specific payment method', () => {
    renderSection({ paymentMethodId: 'pm_1', paymentMethodType: PaymentMethodTypeEnum.Provider })

    expect(lastSubtitle()).toBe('Use a specific payment method')
  })

  it('summarises the manual behaviour', () => {
    renderSection({ paymentMethodId: null, paymentMethodType: PaymentMethodTypeEnum.Manual })

    expect(lastSubtitle()).toBe('Do not use any payment method')
  })

  it('forwards the external customer id to the drawer', () => {
    renderSection(undefined, 'ext-42')

    expect(mockDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ externalCustomerId: 'ext-42' }),
    )
  })

  it('wires the drawer onSave back to the paymentMethod form field', () => {
    const { form } = renderSection(undefined)

    const { onSave } = mockDrawer.mock.calls.at(-1)?.[0] as {
      onSave: (v: { paymentMethod: SelectedPaymentMethod }) => void
    }

    const next: SelectedPaymentMethod = {
      paymentMethodId: 'pm_9',
      paymentMethodType: PaymentMethodTypeEnum.Provider,
    }

    onSave({ paymentMethod: next })

    expect(form.setFieldValue).toHaveBeenCalledWith('paymentMethod', next)
  })
})
