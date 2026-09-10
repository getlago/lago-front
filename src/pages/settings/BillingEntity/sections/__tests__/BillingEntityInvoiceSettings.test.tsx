import { act, screen } from '@testing-library/react'

import { PAYMENT_TERM_SETTINGS_ROW_TEST_ID } from '~/components/paymentTerms/dataTestConstants'
import { FeatureFlagEnum, GetBillingEntitySettingsQuery } from '~/generated/graphql'
import { render } from '~/test-utils'

import BillingEntityInvoiceSettings, {
  BILLING_ENTITY_ISSUING_DATE_POLICY_TEST_ID,
} from '../BillingEntityInvoiceSettings'

const mockFeatureFlags = new Set<FeatureFlagEnum>()
const mockUseGetBillingEntitySettingsQuery = jest.fn()

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ billingEntityCode: 'acme' }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetBillingEntitySettingsQuery: () => mockUseGetBillingEntitySettingsQuery(),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasFeatureFlag: (flag: FeatureFlagEnum) => mockFeatureFlags.has(flag),
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => true }),
}))

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({ open: jest.fn(), close: jest.fn() }),
}))

const billingEntity = {
  __typename: 'BillingEntity',
  id: 'be-1',
  code: 'acme',
  name: 'Acme',
  netPaymentTerm: 30,
  defaultCurrency: 'EUR',
  documentNumbering: 'per_customer',
  documentNumberPrefix: 'ACM',
  finalizeZeroAmountInvoice: true,
  billingConfiguration: {
    __typename: 'BillingEntityBillingConfiguration',
    id: 'bc-1',
    invoiceGracePeriod: 0,
    invoiceFooter: null,
    documentLocale: 'en',
    subscriptionInvoiceIssuingDateAdjustment: 'align_with_finalization_date',
    subscriptionInvoiceIssuingDateAnchor: 'next_period_start',
  },
} as unknown as NonNullable<GetBillingEntitySettingsQuery['billingEntity']>

const renderSettings = async (
  netPaymentTerm: NonNullable<
    GetBillingEntitySettingsQuery['billingEntity']
  >['netPaymentTerm'] = 30,
): Promise<void> => {
  mockUseGetBillingEntitySettingsQuery.mockReturnValue({
    data: {
      billingEntity: { ...billingEntity, netPaymentTerm },
      taxes: { collection: [] },
      invoiceCustomSections: { collection: [] },
    },
    loading: false,
    error: undefined,
  })

  await act(async () => {
    render(<BillingEntityInvoiceSettings />)
  })
}

describe('BillingEntityInvoiceSettings', () => {
  beforeEach(() => {
    mockFeatureFlags.clear()
  })

  it.each([
    [null, '0 day'],
    [0, '0 day'],
    [1, '1 day'],
    [30, '30 days'],
  ])('GIVEN a net payment term of %s WHEN rendered THEN it shows %s', async (term, copy) => {
    await renderSettings(term)

    expect(screen.getByTestId(BILLING_ENTITY_NET_PAYMENT_TERM_TEST_ID)).toHaveTextContent(copy)
  })

  it('GIVEN the product catalog flag is off WHEN rendered THEN the net payment term item is shown', async () => {
    await renderSettings()

    expect(screen.getByTestId(PAYMENT_TERM_SETTINGS_ROW_TEST_ID)).toBeInTheDocument()
  })

  it('GIVEN the product catalog flag is on WHEN rendered THEN the net payment term item is hidden', async () => {
    mockFeatureFlags.add(FeatureFlagEnum.ProductCatalog)

    await renderSettings()

    expect(screen.queryByTestId(PAYMENT_TERM_SETTINGS_ROW_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN the product catalog flag is on WHEN rendered THEN the issuing date policy item is still shown', async () => {
    mockFeatureFlags.add(FeatureFlagEnum.ProductCatalog)

    await renderSettings()

    expect(screen.getByTestId(BILLING_ENTITY_ISSUING_DATE_POLICY_TEST_ID)).toBeInTheDocument()
  })
})
