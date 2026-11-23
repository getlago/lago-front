import { screen } from '@testing-library/react'

import { BillingEntity, FeatureFlagEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import BillingEntityMain, {
  BILLING_ENTITY_DUNNING_CAMPAIGNS_ITEM_ID,
  BILLING_ENTITY_MAIN_ITEM_TEST_ID,
} from '../BillingEntityMain'

const mockFeatureFlags = new Set<FeatureFlagEnum>()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasFeatureFlag: (flag: FeatureFlagEnum) => mockFeatureFlags.has(flag),
  }),
}))

const DUNNING_ITEM_TEST_ID = `${BILLING_ENTITY_MAIN_ITEM_TEST_ID}-${BILLING_ENTITY_DUNNING_CAMPAIGNS_ITEM_ID}`
const INVOICE_SETTINGS_ITEM_TEST_ID = `${BILLING_ENTITY_MAIN_ITEM_TEST_ID}-be-invoice-settings`
const TAXES_ITEM_TEST_ID = `${BILLING_ENTITY_MAIN_ITEM_TEST_ID}-be-taxes`

const renderMain = () =>
  render(<BillingEntityMain billingEntity={{ id: 'be-1', code: 'acme' } as BillingEntity} />)

describe('BillingEntityMain', () => {
  beforeEach(() => {
    mockFeatureFlags.clear()
  })

  it('GIVEN the product catalog flag is off WHEN rendered THEN the dunning campaigns entry is listed', () => {
    renderMain()

    expect(screen.getByTestId(DUNNING_ITEM_TEST_ID)).toBeInTheDocument()
  })

  it('GIVEN the product catalog flag is on WHEN rendered THEN the dunning campaigns entry is hidden', () => {
    mockFeatureFlags.add(FeatureFlagEnum.ProductCatalog)

    renderMain()

    expect(screen.queryByTestId(DUNNING_ITEM_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN the product catalog flag is on WHEN rendered THEN the other entries are still listed', () => {
    mockFeatureFlags.add(FeatureFlagEnum.ProductCatalog)

    renderMain()

    expect(screen.getByTestId(INVOICE_SETTINGS_ITEM_TEST_ID)).toBeInTheDocument()
    expect(screen.getByTestId(TAXES_ITEM_TEST_ID)).toBeInTheDocument()
  })
})
