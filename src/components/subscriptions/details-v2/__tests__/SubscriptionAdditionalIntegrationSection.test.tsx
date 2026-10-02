import { useAdditionalIntegrationSettingsDrawer } from '~/components/additionalIntegrationSettings/useAdditionalIntegrationSettingsDrawer'
import { SectionHeaderProps } from '~/components/plans/details-v2/shared/SectionHeader'
import {
  ConnectionBehaviorEnum,
  ConnectionCategoryEnum,
  ConnectionResolvedBehaviorEnum,
  SubscriptionPaymentSectionFragment,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionAdditionalIntegrationSection } from '../SubscriptionAdditionalIntegrationSection'

const mockOpen = jest.fn()
const mockSave = jest.fn()
const mockHeader = jest.fn<null, [SectionHeaderProps]>(() => null)
const mockDrawer = jest.fn<
  ReturnType<typeof useAdditionalIntegrationSettingsDrawer>,
  Parameters<typeof useAdditionalIntegrationSettingsDrawer>
>()
let mockEnabled = true
let mockCanUpdate = true

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ hasFeatureFlag: () => mockEnabled }),
}))
jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => mockCanUpdate }),
}))
jest.mock('~/hooks/customer/useUpdateSubscriptionSettings', () => ({
  useUpdateSubscriptionSettings: () => ({ saveAdditionalIntegrations: mockSave }),
}))
jest.mock(
  '~/components/additionalIntegrationSettings/useAdditionalIntegrationSettingsDrawer',
  () => ({
    useAdditionalIntegrationSettingsDrawer: (
      props: Parameters<typeof useAdditionalIntegrationSettingsDrawer>[0],
    ) => mockDrawer(props),
  }),
)
jest.mock('~/components/plans/details-v2/shared/SectionHeader', () => ({
  SectionHeader: (props: SectionHeaderProps) => mockHeader(props),
}))
jest.mock('~/hooks/customer/useCustomerIntegrationConnections', () => ({
  useCustomerIntegrationConnections: () => ({ connections: [] }),
}))

const subscription: SubscriptionPaymentSectionFragment = {
  id: 'subscription',
  customer: { id: 'customer', externalId: 'external' },
  connections: [
    {
      category: ConnectionCategoryEnum.Accounting,
      behavior: ConnectionResolvedBehaviorEnum.Specific,
      code: 'netsuite_eu',
    },
    {
      category: ConnectionCategoryEnum.Crm,
      behavior: ConnectionResolvedBehaviorEnum.Inherit,
      code: 'salesforce_default',
    },
    {
      category: ConnectionCategoryEnum.Tax,
      behavior: ConnectionResolvedBehaviorEnum.Skip,
      code: null,
    },
  ],
}

describe('SubscriptionAdditionalIntegrationSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEnabled = true
    mockCanUpdate = true
    mockDrawer.mockReturnValue({ openDrawer: mockOpen })
  })

  it('shows resolved connections and opens the drawer with persisted behavior', () => {
    const { getByText } = render(
      <SubscriptionAdditionalIntegrationSection subscription={subscription} />,
    )
    expect(getByText('netsuite_eu')).toBeInTheDocument()
    expect(getByText('salesforce_default')).toBeInTheDocument()
    mockHeader.mock.calls.at(-1)?.[0].action?.onClick()
    expect(mockOpen).toHaveBeenCalledWith({
      accounting: { code: 'netsuite_eu' },
      crm: undefined,
      tax: { behavior: ConnectionBehaviorEnum.Skip },
    })
    expect(mockDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer', onSave: mockSave }),
    )
  })

  it('hides the section when the feature is disabled', () => {
    mockEnabled = false
    render(<SubscriptionAdditionalIntegrationSection subscription={subscription} />)
    expect(mockHeader).not.toHaveBeenCalled()
  })

  it('hides edit without update permission', () => {
    mockCanUpdate = false
    render(<SubscriptionAdditionalIntegrationSection subscription={subscription} />)
    expect(mockHeader.mock.calls.at(-1)?.[0].action?.hidden).toBe(true)
  })
})
