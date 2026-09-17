import { renderHook } from '@testing-library/react'

import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
import { scrollToTop } from '~/core/utils/domUtils'

import { usePlanForm } from '../usePlanForm'

const mockSetErrorMap = jest.fn()
const mockForm = {
  setErrorMap: mockSetErrorMap,
  store: { subscribe: jest.fn(() => jest.fn()), getState: () => ({ values: {} }) },
}

let mockHasExistingCodeError = false
let mockCreateError: unknown = undefined

jest.mock('~/core/apolloClient', () => ({
  addToast: jest.fn(),
  envGlobalVar: () => ({ disableSignUp: false, sentryDsn: '', apiUrl: '', appVersion: '' }),
  hasDefinedGQLError: (code: string) => code === 'ValueAlreadyExist' && mockHasExistingCodeError,
}))

jest.mock('~/core/apolloClient/reactiveVars/duplicatePlanVar', () => ({
  PLAN_FORM_TYPE: {},
  resetDuplicatePlanVar: jest.fn(),
  useDuplicatePlanVar: () => ({ parentId: undefined, type: undefined }),
}))

// Mocked wholesale rather than with requireActual: the real module pulls the
// lazy-loaded route tree in, which jest cannot parse.
jest.mock('~/core/router', () => ({
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE: '/customer/:customerId/subscription/:subscriptionId/:tab',
  ERROR_404_ROUTE: '/404',
  PLAN_DETAILS_ROUTE: '/plan/:planId/:tab',
  PLAN_SUBSCRIPTION_DETAILS_ROUTE: '/plan/:planId/subscription/:subscriptionId/:tab',
  useNavigate: () => jest.fn(),
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ planId: 'plan-1' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}))

jest.mock('~/core/utils/domUtils', () => ({ scrollToTop: jest.fn() }))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreatePlanMutation: () => [jest.fn(), { error: mockCreateError }],
}))

jest.mock('~/hooks/plans/usePlanUpdate', () => ({
  usePlanUpdate: () => ({ update: jest.fn(), error: undefined }),
}))

jest.mock('~/hooks/plans/usePlanFormSetup', () => ({
  usePlanFormSetup: () => ({
    form: mockForm,
    plan: undefined,
    loading: false,
    error: undefined,
  }),
}))

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({ hasAnyPricingUnitConfigured: false }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: { defaultCurrency: 'USD' } }),
}))

describe('usePlanForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasExistingCodeError = false
    mockCreateError = undefined
  })

  describe('GIVEN the backend accepted the plan', () => {
    describe('WHEN the hook renders', () => {
      it('THEN leaves the code field untouched', () => {
        renderHook(() => usePlanForm({}))

        expect(mockSetErrorMap).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the backend rejected the code as already existing', () => {
    beforeEach(() => {
      mockHasExistingCodeError = true
      mockCreateError = { message: 'ValueAlreadyExist' }
    })

    describe('WHEN the hook renders', () => {
      // Guards the stuck-submit bug: this form used to write the error with
      // `setFieldMeta`, which no validation pass ever clears, so the submit
      // button stayed disabled until the page was left.
      it('THEN applies the duplicate-code error through the self-clearing channel', () => {
        renderHook(() => usePlanForm({}))

        expect(mockSetErrorMap).toHaveBeenCalledWith({
          onDynamic: {
            fields: { code: { message: EXISTING_CODE_ERROR_MESSAGE, path: ['code'] } },
          },
        })
      })

      it('THEN scrolls the centered page back to the code field', () => {
        renderHook(() => usePlanForm({}))

        expect(scrollToTop).toHaveBeenCalledWith('[data-centered-page-wrapper]')
      })
    })
  })
})
