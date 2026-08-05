import { fireEvent, render, screen } from '@testing-library/react'

import { CustomerAccountTypeQuickFilter } from '~/components/Filters/graphql/CustomerAccountTypeQuickFilter'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

const mockIsQuickFilterActive = jest.fn().mockReturnValue(false)
const mockBuildQuickFilterUrlParams = jest.fn().mockReturnValue('accountType=partner')
const mockOpenPremiumWarningDialog = jest.fn()

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    isQuickFilterActive: mockIsQuickFilterActive,
    buildQuickFilterUrlParams: mockBuildQuickFilterUrlParams,
    hasAppliedFilters: false,
  }),
}))

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({
    open: mockOpenPremiumWarningDialog,
  }),
}))

const mockOrganization: { premiumIntegrations?: PremiumIntegrationTypeEnum[] } = {}

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: mockOrganization,
  }),
}))

const renderComponent = () => {
  return render(<CustomerAccountTypeQuickFilter />, { wrapper: AllTheProviders })
}

describe('CustomerAccountTypeQuickFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOrganization.premiumIntegrations = []
  })

  describe('GIVEN the quick filter renders', () => {
    it('THEN displays a Customer and a Partner button', () => {
      renderComponent()

      expect(screen.getAllByRole('button')).toHaveLength(2)
    })
  })

  describe('GIVEN no access to revenue share', () => {
    describe('WHEN the Partner button is clicked', () => {
      it('THEN opens the premium warning dialog and does not navigate', () => {
        renderComponent()

        fireEvent.click(screen.getAllByRole('button')[1])

        expect(mockOpenPremiumWarningDialog).toHaveBeenCalled()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN access to revenue share', () => {
    describe('WHEN the Partner button is clicked', () => {
      it('THEN navigates using the built quick filter url params', () => {
        mockOrganization.premiumIntegrations = [PremiumIntegrationTypeEnum.RevenueShare]

        renderComponent()

        fireEvent.click(screen.getAllByRole('button')[1])

        expect(mockOpenPremiumWarningDialog).not.toHaveBeenCalled()
        expect(testMockNavigateFn).toHaveBeenCalledWith({ search: 'accountType=partner' })
      })
    })
  })
})
