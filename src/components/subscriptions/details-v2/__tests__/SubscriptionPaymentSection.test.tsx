import { ComponentProps } from 'react'

import { useConnectionPaymentSettingsDrawer } from '~/components/paymentSettings/connectionFirst/useConnectionPaymentSettingsDrawer'
import { PaymentSettingsDrawerRef } from '~/components/paymentSettings/PaymentSettingsDrawer'
import { SectionHeaderProps } from '~/components/plans/details-v2/shared/SectionHeader'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import {
  ConnectionBehaviorEnum,
  ConnectionCategoryEnum,
  ConnectionResolvedBehaviorEnum,
  PaymentMethodTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionPaymentSection } from '../SubscriptionPaymentSection'

const mockSectionHeader: jest.Mock<null, [SectionHeaderProps]> = jest.fn()
const mockPaymentMethodDetails: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockDrawer: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockSavePayment = jest.fn()
const mockOpenConnectionDrawer = jest.fn()
const mockOpenLegacyDrawer = jest.fn()
let mockMultiConnection = false
let mockCanUpdate = true
const mockConnectionDrawer = jest.fn<
  ReturnType<typeof useConnectionPaymentSettingsDrawer>,
  Parameters<typeof useConnectionPaymentSettingsDrawer>
>()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ hasFeatureFlag: () => mockMultiConnection }),
}))

jest.mock(
  '~/components/paymentSettings/connectionFirst/useConnectionPaymentSettingsDrawer',
  () => ({
    useConnectionPaymentSettingsDrawer: (
      props: Parameters<typeof useConnectionPaymentSettingsDrawer>[0],
    ) => mockConnectionDrawer(props),
  }),
)

jest.mock('~/components/plans/details-v2/shared/SectionHeader', () => ({
  SectionHeader: (props: SectionHeaderProps) => {
    mockSectionHeader(props)

    return null
  },
}))

jest.mock('~/components/subscriptions/SubscriptionPaymentMethodDetails', () => ({
  SubscriptionPaymentMethodDetails: (props: Record<string, unknown>) => {
    mockPaymentMethodDetails(props)

    return null
  },
}))

jest.mock('~/components/paymentSettings/PaymentSettingsDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual<typeof import('react')>('react')

  return {
    PaymentSettingsDrawer: forwardRef<PaymentSettingsDrawerRef, Record<string, unknown>>(
      (props, ref) => {
        useImperativeHandle(ref, () => ({
          openDrawer: mockOpenLegacyDrawer,
          closeDrawer: jest.fn(),
        }))
        mockDrawer(props)
        return null
      },
    ),
  }
})

jest.mock('~/hooks/customer/useUpdateSubscriptionSettings', () => ({
  useUpdateSubscriptionSettings: () => ({ savePayment: mockSavePayment, saveInvoicing: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => mockCanUpdate }),
}))

const subscription = {
  id: 'sub_1',
  connections: [],
  paymentMethodType: PaymentMethodTypeEnum.Provider,
  paymentMethod: { id: 'pm_1' },
  customer: { id: 'cust_1', externalId: 'ext_1' },
}

const renderSection = (
  value: ComponentProps<typeof SubscriptionPaymentSection>['subscription'] = subscription,
) => render(<SubscriptionPaymentSection subscription={value} />)

describe('SubscriptionPaymentSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMultiConnection = false
    mockCanUpdate = true
    mockConnectionDrawer.mockReturnValue({ openDrawer: mockOpenConnectionDrawer })
  })

  describe('GIVEN the connection feature is enabled', () => {
    beforeEach(() => {
      mockMultiConnection = true
    })

    it('THEN should open the shared connection drawer from the overview edit action', () => {
      renderSection()
      expect(mockOpenConnectionDrawer).not.toHaveBeenCalled()
      expect(mockDrawer).not.toHaveBeenCalled()
      mockSectionHeader.mock.calls.at(-1)?.[0].action?.onClick()
      expect(mockConnectionDrawer).toHaveBeenCalledWith({
        viewType: ViewTypeEnum.Subscription,
        customerId: 'cust_1',
        onSave: mockSavePayment,
      })
      expect(mockOpenConnectionDrawer).toHaveBeenCalledWith({
        connection: undefined,
        paymentMethod: {
          paymentMethodType: PaymentMethodTypeEnum.Provider,
          paymentMethodId: 'pm_1',
        },
      })
      expect(mockOpenLegacyDrawer).not.toHaveBeenCalled()
    })

    it.each([
      [PaymentMethodTypeEnum.Manual, { behavior: ConnectionBehaviorEnum.Skip }],
      [PaymentMethodTypeEnum.Provider, undefined],
    ])(
      'THEN should seed %s with a complete default-method choice',
      (paymentMethodType, connection) => {
        renderSection({ ...subscription, paymentMethodType, paymentMethod: null })
        mockSectionHeader.mock.calls.at(-1)?.[0].action?.onClick()
        expect(mockOpenConnectionDrawer).toHaveBeenCalledWith({
          connection,
          paymentMethod: { paymentMethodType, paymentMethodId: null },
        })
      },
    )

    it.each([
      [ConnectionResolvedBehaviorEnum.Specific, { code: 'stripe_default' }],
      [ConnectionResolvedBehaviorEnum.Inherit, undefined],
      [ConnectionResolvedBehaviorEnum.Skip, { behavior: ConnectionBehaviorEnum.Skip }],
    ])(
      'THEN should reopen persisted %s routing independently of the connection code',
      (behavior, connection) => {
        const { unmount } = renderSection()

        unmount()
        renderSection({
          ...subscription,
          connections: [
            { category: ConnectionCategoryEnum.Payment, behavior, code: 'stripe_default' },
          ],
        })
        mockSectionHeader.mock.calls.at(-1)?.[0].action?.onClick()
        expect(mockOpenConnectionDrawer).toHaveBeenCalledWith({
          connection,
          paymentMethod: {
            paymentMethodType: PaymentMethodTypeEnum.Provider,
            paymentMethodId: 'pm_1',
          },
        })
      },
    )

    it('THEN should hide edit without subscription update permission', () => {
      mockCanUpdate = false
      renderSection()
      expect(mockSectionHeader.mock.calls.at(-1)?.[0].action?.hidden).toBe(true)
      expect(mockOpenConnectionDrawer).not.toHaveBeenCalled()
    })
  })

  it('THEN should keep opening the legacy drawer when the flag is disabled', () => {
    mockMultiConnection = false
    renderSection()
    mockSectionHeader.mock.calls.at(-1)?.[0].action?.onClick()
    expect(mockOpenLegacyDrawer).toHaveBeenCalledWith({
      paymentMethod: { paymentMethodType: PaymentMethodTypeEnum.Provider, paymentMethodId: 'pm_1' },
    })
    expect(mockOpenConnectionDrawer).not.toHaveBeenCalled()
  })

  it('renders the payment section header, display and drawer', () => {
    renderSection()

    expect(mockSectionHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'text_1782825858647rr5zp42t63m',
        description: 'text_1782825858647ro8ahgg7uys',
      }),
    )
    expect(mockPaymentMethodDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedPaymentMethod: {
          paymentMethodType: PaymentMethodTypeEnum.Provider,
          paymentMethodId: 'pm_1',
        },
        externalCustomerId: 'ext_1',
      }),
    )
    expect(mockDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ onSave: mockSavePayment, externalCustomerId: 'ext_1' }),
    )
  })
})
