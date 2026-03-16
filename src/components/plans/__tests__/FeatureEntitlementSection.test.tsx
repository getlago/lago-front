import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps } from 'formik'

import { CurrencyEnum, PlanInterval, PrivilegeValueTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  ADD_FEATURE_ENTITLEMENT_TEST_ID,
  FEATURE_ENTITLEMENT_SELECTOR_TEST_ID,
  FeatureEntitlementSection,
} from '../FeatureEntitlementSection'
import { LocalEntitlementInput, PlanFormInput } from '../types'

// --- Mocks ---

const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/plans/drawers/FeatureEntitlementDrawer', () => {
  const React = jest.requireActual('react')

  const MockedDrawer = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDrawer: mockOpenDrawer,
      closeDrawer: mockCloseDrawer,
    }))

    return React.createElement('div', { 'data-test': 'feature-entitlement-drawer-mock' })
  })

  MockedDrawer.displayName = 'FeatureEntitlementDrawer'

  return {
    FeatureEntitlementDrawer: MockedDrawer,
    FeatureEntitlementDrawerRef: {},
  }
})

// --- Helpers ---

const createFormikProps = (overrides: Partial<PlanFormInput> = {}): FormikProps<PlanFormInput> => {
  const defaultValues: PlanFormInput = {
    name: 'Test Plan',
    code: 'test-plan',
    description: '',
    interval: PlanInterval.Monthly,
    payInAdvance: false,
    amountCents: '100',
    amountCurrency: CurrencyEnum.Usd,
    trialPeriod: 0,
    taxes: [],
    billChargesMonthly: false,
    billFixedChargesMonthly: false,
    charges: [],
    fixedCharges: [],
    minimumCommitment: {},
    invoiceDisplayName: '',
    entitlements: [],
    ...overrides,
  }

  return {
    values: defaultValues,
    initialValues: defaultValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValidating: false,
    submitCount: 0,
    dirty: false,
    isValid: true,
    status: undefined,
    handleBlur: jest.fn(),
    handleChange: jest.fn(),
    handleReset: jest.fn(),
    handleSubmit: jest.fn(),
    resetForm: jest.fn(),
    setErrors: jest.fn(),
    setFieldError: jest.fn(),
    setFieldTouched: jest.fn(),
    setFieldValue: jest.fn(),
    setFormikState: jest.fn(),
    setStatus: jest.fn(),
    setSubmitting: jest.fn(),
    setTouched: jest.fn(),
    setValues: jest.fn(),
    submitForm: jest.fn(),
    validateForm: jest.fn(),
    validateField: jest.fn(),
    getFieldHelpers: jest.fn(),
    getFieldMeta: jest.fn(),
    getFieldProps: jest.fn(),
    registerField: jest.fn(),
    unregisterField: jest.fn(),
  } as unknown as FormikProps<PlanFormInput>
}

const createEntitlement = (
  overrides: Partial<LocalEntitlementInput> = {},
): LocalEntitlementInput => ({
  featureId: 'feature-1',
  featureName: 'Feature One',
  featureCode: 'feature_one',
  privileges: [],
  ...overrides,
})

const defaultProps = {
  formikProps: createFormikProps(),
  onDrawerSave: jest.fn(),
}

describe('FeatureEntitlementSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN no entitlements exist', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should render the add button', () => {
        render(<FeatureEntitlementSection {...defaultProps} />)

        expect(screen.getByTestId(ADD_FEATURE_ENTITLEMENT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the FeatureEntitlementDrawer', () => {
        render(<FeatureEntitlementSection {...defaultProps} />)

        expect(screen.getByTestId('feature-entitlement-drawer-mock')).toBeInTheDocument()
      })

      it('THEN should not render any selectors', () => {
        render(<FeatureEntitlementSection {...defaultProps} />)

        expect(screen.queryByTestId(FEATURE_ENTITLEMENT_SELECTOR_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the add button is clicked', () => {
      it('THEN should open the drawer with no values', async () => {
        const user = userEvent.setup()

        render(<FeatureEntitlementSection {...defaultProps} />)

        await user.click(screen.getByTestId(ADD_FEATURE_ENTITLEMENT_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith()
      })
    })
  })

  describe('GIVEN entitlements exist', () => {
    const entitlements: LocalEntitlementInput[] = [
      createEntitlement(),
      createEntitlement({
        featureId: 'feature-2',
        featureName: 'Feature Two',
        featureCode: 'feature_two',
        privileges: [
          {
            privilegeCode: 'priv_1',
            privilegeName: 'Privilege One',
            value: 'true',
            valueType: PrivilegeValueTypeEnum.Boolean,
          },
        ],
      }),
    ]
    const formikWithEntitlements = createFormikProps({ entitlements })

    describe('WHEN the component is rendered', () => {
      it('THEN should render a selector for each entitlement', () => {
        render(<FeatureEntitlementSection {...defaultProps} formikProps={formikWithEntitlements} />)

        const selectors = screen.getAllByTestId(FEATURE_ENTITLEMENT_SELECTOR_TEST_ID)

        expect(selectors).toHaveLength(2)
      })

      it('THEN should still render the add button', () => {
        render(<FeatureEntitlementSection {...defaultProps} formikProps={formikWithEntitlements} />)

        expect(screen.getByTestId(ADD_FEATURE_ENTITLEMENT_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a selector is clicked', () => {
      it('THEN should open the drawer with the entitlement values', async () => {
        const user = userEvent.setup()

        render(<FeatureEntitlementSection {...defaultProps} formikProps={formikWithEntitlements} />)

        const selectors = screen.getAllByTestId(FEATURE_ENTITLEMENT_SELECTOR_TEST_ID)

        await user.click(selectors[1])

        expect(mockOpenDrawer).toHaveBeenCalledWith({
          featureId: 'feature-2',
          featureName: 'Feature Two',
          featureCode: 'feature_two',
          privileges: [
            {
              privilegeCode: 'priv_1',
              privilegeName: 'Privilege One',
              value: 'true',
              valueType: PrivilegeValueTypeEnum.Boolean,
            },
          ],
        })
      })
    })

    describe('WHEN an entitlement has no featureName', () => {
      it('THEN should display the featureCode as the selector title', () => {
        const entitlementsNoName: LocalEntitlementInput[] = [
          createEntitlement({ featureName: '', featureCode: 'my_code' }),
        ]

        render(
          <FeatureEntitlementSection
            {...defaultProps}
            formikProps={createFormikProps({ entitlements: entitlementsNoName })}
          />,
        )

        const selector = screen.getByTestId(FEATURE_ENTITLEMENT_SELECTOR_TEST_ID)

        expect(selector).toHaveTextContent('my_code')
      })
    })

    describe('WHEN an entitlement has no featureId', () => {
      it('THEN should pass empty string as featureId to the drawer', async () => {
        const user = userEvent.setup()
        const entitlementsNoId: LocalEntitlementInput[] = [
          createEntitlement({ featureId: undefined }),
        ]

        render(
          <FeatureEntitlementSection
            {...defaultProps}
            formikProps={createFormikProps({ entitlements: entitlementsNoId })}
          />,
        )

        await user.click(screen.getByTestId(FEATURE_ENTITLEMENT_SELECTOR_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith(expect.objectContaining({ featureId: '' }))
      })
    })

    describe('WHEN an entitlement has no privileges', () => {
      it('THEN should pass empty array as privileges to the drawer', async () => {
        const user = userEvent.setup()
        const entitlementsNoPriv: LocalEntitlementInput[] = [
          createEntitlement({
            privileges: undefined as unknown as LocalEntitlementInput['privileges'],
          }),
        ]

        render(
          <FeatureEntitlementSection
            {...defaultProps}
            formikProps={createFormikProps({ entitlements: entitlementsNoPriv })}
          />,
        )

        await user.click(screen.getByTestId(FEATURE_ENTITLEMENT_SELECTOR_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith(expect.objectContaining({ privileges: [] }))
      })
    })
  })
})
