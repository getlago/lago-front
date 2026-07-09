import { screen } from '@testing-library/react'

import {
  PaymentMethodTypeEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  WalletDetailsFragment,
} from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'
import { render } from '~/test-utils'

import WalletInformations, {
  WALLET_INFORMATIONS_CONTAINER_TEST_ID,
  WALLET_INFORMATIONS_NO_RECURRING_TEST_ID,
  WALLET_INFORMATIONS_RECURRING_RULE_TEST_ID,
} from '../WalletInformations'

type WalletRecurringRule = NonNullable<WalletDetailsFragment['recurringTransactionRules']>[number]

let mockHasFeatureFlag = false
let mockPaymentMethodsList: PaymentMethodItem[] = []

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))
jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { defaultCurrency: 'USD' },
    intlFormatDateTimeOrgaTZ: () => ({ date: '2024-01-01' }),
    hasFeatureFlag: () => mockHasFeatureFlag,
  }),
}))
jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))
jest.mock('~/hooks/customer/usePaymentMethodsList', () => ({
  usePaymentMethodsList: () => ({
    data: mockPaymentMethodsList,
    loading: false,
    error: false,
    refetch: jest.fn(),
  }),
}))

let mockCustomerIcsData: {
  configurableInvoiceCustomSections: { id: string; name: string }[]
  hasOverwrittenInvoiceCustomSectionsSelection: boolean
  skipInvoiceCustomSections: boolean
} | null = null

jest.mock('~/hooks/useCustomerInvoiceCustomSections', () => ({
  useCustomerInvoiceCustomSections: () => ({
    data: mockCustomerIcsData,
    loading: false,
    error: false,
    customer: null,
  }),
}))

// Translation keys reused for assertions (same literals the component renders)
const MANUAL_PAYMENT_TRANSLATION_KEY = 'text_173799550683709p2rqkoqd5'
const INHERITED_BADGE_TRANSLATION_KEY = 'text_1764327933607jgtpungo2pp'
const NOT_DEFINED_TRANSLATION_KEY = 'text_1772536695408bfc3c38pg36'
const TOPUP_MIN_LABEL_TRANSLATION_KEY = 'text_1758286730208kztcznofxvr'
const TOPUP_MAX_LABEL_TRANSLATION_KEY = 'text_1758286730208ey87jz8nzuz'
const PAID_TOPUP_TYPE_TRANSLATION_KEY = 'text_178004748320594nw5fau04a'
const FREE_TOPUP_TYPE_TRANSLATION_KEY = 'text_17800474832056s97uz7bjy7'
const THRESHOLD_TRIGGER_VALUE_TRANSLATION_KEY = 'text_1773043324341dd9c0u4ilhg'
const THRESHOLD_CREDITS_LABEL_TRANSLATION_KEY = 'text_6560809c38fb9de88d8a5315'
const CREDITS_AMOUNT_TRANSLATION_KEY = 'text_62da6ec24a8e24e44f812896'
const RULE_EXPIRATION_LABEL_TRANSLATION_KEY = 'text_1772536695408pz0actopowa'
const METADATA_HEADER_TRANSLATION_KEY = 'text_63fcc3218d35b9377840f59b'
const TARGET_ONGOING_BALANCE_LABEL_TRANSLATION_KEY = 'text_6657c34670561c0127132da5'
const STARTED_AT_LABEL_TRANSLATION_KEY = 'text_66599bfb69fba1010535c5c2'
const SKIP_TOPUP_LIMITS_LABEL_TRANSLATION_KEY = 'text_1758285686646ty4gyil56oi'
const INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_LABEL_TRANSLATION_KEY = 'text_66a8aed1c3e07b277ec3990d'
const RULE_NUMBER_TRANSLATION_KEY = 'text_1783584917380z3uuxa0ey02'
const YES_TRANSLATION_KEY = 'text_1764160009979jzn4xunn1z8'
const NO_TRANSLATION_KEY = 'text_176416000997957yqelmt2m2'

const createMockRecurringRule = (overrides = {}): WalletRecurringRule =>
  ({
    lagoId: 'rule-1',
    method: RecurringTransactionMethodEnum.Fixed,
    transactionName: null,
    paidCredits: '10.0',
    grantedCredits: '5.0',
    grantsTargetTopUp: null,
    targetOngoingBalance: null,
    trigger: RecurringTransactionTriggerEnum.Threshold,
    thresholdCredits: '100.0',
    expirationAt: null,
    interval: null,
    startedAt: null,
    invoiceRequiresSuccessfulPayment: false,
    ignorePaidTopUpLimits: false,
    transactionMetadata: [],
    paymentMethodType: null,
    paymentMethod: null,
    skipInvoiceCustomSections: false,
    selectedInvoiceCustomSections: [],
    ...overrides,
  }) as WalletRecurringRule

const createMockWallet = (overrides = {}) =>
  ({
    id: 'wallet-1',
    code: 'wallet-code',
    name: 'Test Wallet',
    currency: 'USD',
    rateAmount: 1,
    priority: 1,
    expirationAt: null,
    paidTopUpMinAmountCents: null,
    paidTopUpMaxAmountCents: null,
    appliesTo: null,
    paymentMethod: null,
    selectedInvoiceCustomSections: [],
    recurringTransactionRules: [],
    balanceCents: '10000',
    consumedAmountCents: '5000',
    consumedCredits: '50',
    createdAt: '2024-01-01T00:00:00Z',
    creditsBalance: 100,
    lastBalanceSyncAt: '2024-01-01T00:00:00Z',
    lastConsumedCreditAt: '2024-01-01T00:00:00Z',
    lastOngoingBalanceSyncAt: '2024-01-01T00:00:00Z',
    status: 'active',
    terminatedAt: null,
    ongoingBalanceCents: '8000',
    creditsOngoingBalance: '80',
    ongoingUsageBalanceCents: '0',
    creditsOngoingUsageBalance: 0,
    traceable: true,
    customer: null,
    ...overrides,
  }) as unknown as WalletDetailsFragment

describe('WalletInformations', () => {
  beforeEach(() => {
    mockHasFeatureFlag = false
    mockPaymentMethodsList = []
    mockCustomerIcsData = null
  })

  describe('GIVEN no wallet', () => {
    describe('WHEN rendered', () => {
      it('THEN should render nothing', () => {
        const { container } = render(<WalletInformations />)

        expect(container.innerHTML).toBe('')
      })
    })
  })

  describe('GIVEN wallet data', () => {
    describe('WHEN rendered', () => {
      it('THEN should show wallet informations container', () => {
        render(<WalletInformations wallet={createMockWallet()} />)

        expect(screen.getByTestId(WALLET_INFORMATIONS_CONTAINER_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN wallet with no recurring rules', () => {
    describe('WHEN isPremium', () => {
      it('THEN should show no recurring message', () => {
        render(<WalletInformations wallet={createMockWallet()} />)

        expect(screen.getByTestId(WALLET_INFORMATIONS_NO_RECURRING_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN payment method details are empty ({})', () => {
    describe('WHEN the payment method is manual', () => {
      it('THEN resolves "Manual payment" without an inherited badge', () => {
        render(
          <WalletInformations
            wallet={createMockWallet({
              customer: { id: 'cust-1', externalId: 'ext-1' },
              paymentMethodType: PaymentMethodTypeEnum.Manual,
              paymentMethod: { details: {} },
            })}
          />,
        )

        expect(screen.getByText(MANUAL_PAYMENT_TRANSLATION_KEY)).toBeInTheDocument()
        expect(screen.queryByText(INHERITED_BADGE_TRANSLATION_KEY)).not.toBeInTheDocument()
      })
    })

    describe('WHEN a specific provider card is selected (resolved from the list)', () => {
      it('THEN shows the card and NOT the inherited badge', () => {
        mockPaymentMethodsList = [
          createMockPaymentMethod({ id: 'pm_default', isDefault: true }),
          createMockPaymentMethod({ id: 'pm_specific', isDefault: false }),
        ]

        render(
          <WalletInformations
            wallet={createMockWallet({
              customer: { id: 'cust-1', externalId: 'ext-1' },
              paymentMethodType: PaymentMethodTypeEnum.Provider,
              paymentMethod: { id: 'pm_specific', details: {} },
            })}
          />,
        )

        expect(
          screen.queryByText(INHERITED_BADGE_TRANSLATION_KEY, { exact: false }),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByText(MANUAL_PAYMENT_TRANSLATION_KEY, { exact: false }),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN it falls back to the customer default (no specific method)', () => {
      it('THEN shows the inherited badge', () => {
        mockPaymentMethodsList = [createMockPaymentMethod({ id: 'pm_default', isDefault: true })]

        render(
          <WalletInformations
            wallet={createMockWallet({
              customer: { id: 'cust-1', externalId: 'ext-1' },
              paymentMethodType: PaymentMethodTypeEnum.Provider,
              paymentMethod: null,
            })}
          />,
        )

        expect(
          screen.getByText(INHERITED_BADGE_TRANSLATION_KEY, { exact: false }),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN empty top-up min/max limits', () => {
    describe('WHEN rendered', () => {
      it('THEN shows "-" instead of the grey "Not defined" label', () => {
        render(<WalletInformations wallet={createMockWallet()} />)

        expect(screen.queryByText(NOT_DEFINED_TRANSLATION_KEY)).not.toBeInTheDocument()
        expect(screen.getByText(TOPUP_MIN_LABEL_TRANSLATION_KEY).parentElement).toHaveTextContent(
          '-',
        )
        expect(screen.getByText(TOPUP_MAX_LABEL_TRANSLATION_KEY).parentElement).toHaveTextContent(
          '-',
        )
      })
    })
  })

  describe('GIVEN a recurring rule with the Target method', () => {
    it('THEN shows the target ongoing balance as credits + converted currency', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [
              createMockRecurringRule({
                method: RecurringTransactionMethodEnum.Target,
                grantsTargetTopUp: false,
                targetOngoingBalance: '150.0',
                trigger: RecurringTransactionTriggerEnum.Interval,
                interval: RecurringTransactionIntervalEnum.Monthly,
                thresholdCredits: null,
              }),
            ],
          })}
        />,
      )

      expect(screen.getByText(TARGET_ONGOING_BALANCE_LABEL_TRANSLATION_KEY)).toBeInTheDocument()
      expect(screen.getByText('text_62da6ec24a8e24e44f812896 • $150.00')).toBeInTheDocument()
      expect(screen.getByText(PAID_TOPUP_TYPE_TRANSLATION_KEY)).toBeInTheDocument()
    })

    it('THEN shows a configured target of 0 as a value, not as unset', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [
              createMockRecurringRule({
                method: RecurringTransactionMethodEnum.Target,
                grantsTargetTopUp: false,
                targetOngoingBalance: '0',
              }),
            ],
          })}
        />,
      )

      expect(screen.getByText('text_62da6ec24a8e24e44f812896 • $0.00')).toBeInTheDocument()
    })
  })

  describe('GIVEN a recurring rule with the Interval trigger', () => {
    it('THEN shows the start date row', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [
              createMockRecurringRule({
                trigger: RecurringTransactionTriggerEnum.Interval,
                interval: RecurringTransactionIntervalEnum.Weekly,
                thresholdCredits: null,
                startedAt: '2024-01-01T00:00:00Z',
              }),
            ],
          })}
        />,
      )

      expect(screen.getByText(STARTED_AT_LABEL_TRANSLATION_KEY)).toBeInTheDocument()
      expect(screen.getByText('2024-01-01')).toBeInTheDocument()
    })
  })

  describe('GIVEN a recurring rule with invoiceRequiresSuccessfulPayment enabled', () => {
    it('THEN shows the row with a Yes value', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [
              createMockRecurringRule({ invoiceRequiresSuccessfulPayment: true }),
            ],
          })}
        />,
      )

      expect(
        screen.getByText(INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_LABEL_TRANSLATION_KEY),
      ).toBeInTheDocument()
      expect(screen.getByText(YES_TRANSLATION_KEY)).toBeInTheDocument()

      // Factory default trigger: the threshold row renders alongside
      expect(screen.getByText(THRESHOLD_TRIGGER_VALUE_TRANSLATION_KEY)).toBeInTheDocument()
      expect(screen.getByText(THRESHOLD_CREDITS_LABEL_TRANSLATION_KEY)).toBeInTheDocument()
      expect(screen.getByText(CREDITS_AMOUNT_TRANSLATION_KEY)).toBeInTheDocument()
    })
  })

  describe('GIVEN a Fixed rule with only granted credits', () => {
    it('THEN hides the toggles the form never exposed for this rule', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            paidTopUpMinAmountCents: '1000',
            recurringTransactionRules: [
              createMockRecurringRule({ paidCredits: '0.0', ignorePaidTopUpLimits: false }),
            ],
          })}
        />,
      )

      expect(screen.queryByText(SKIP_TOPUP_LIMITS_LABEL_TRANSLATION_KEY)).not.toBeInTheDocument()
      expect(
        screen.queryByText(INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_LABEL_TRANSLATION_KEY),
      ).not.toBeInTheDocument()
    })
  })

  describe('GIVEN a rule with its own specific payment method', () => {
    it('THEN resolves it from the customer list while the wallet falls back to the inherited default', () => {
      mockPaymentMethodsList = [
        createMockPaymentMethod({ id: 'pm_default', isDefault: true }),
        createMockPaymentMethod({ id: 'pm_specific', isDefault: false }),
      ]

      render(
        <WalletInformations
          wallet={createMockWallet({
            customer: { id: 'cust-1', externalId: 'ext-1' },
            paymentMethodType: PaymentMethodTypeEnum.Provider,
            paymentMethod: null,
            recurringTransactionRules: [
              createMockRecurringRule({
                paymentMethodType: PaymentMethodTypeEnum.Provider,
                paymentMethod: { id: 'pm_specific' },
              }),
            ],
          })}
        />,
      )

      // Only the wallet-level row inherits (badge) — the rule resolves its own card
      expect(screen.getAllByText(INHERITED_BADGE_TRANSLATION_KEY, { exact: false })).toHaveLength(1)
    })
  })

  describe('GIVEN a rule with explicitly selected invoice custom sections', () => {
    it('THEN shows the rule-level section chips', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [
              createMockRecurringRule({
                selectedInvoiceCustomSections: [{ id: 'ics-r1', name: 'Rule Footer' }],
              }),
            ],
          })}
        />,
      )

      expect(screen.getByText('Rule Footer')).toBeInTheDocument()
    })
  })

  describe('GIVEN a Fixed rule and wallet top-up limits', () => {
    it('THEN shows the skip-limits row (No when the rule follows the limits)', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            paidTopUpMinAmountCents: '1000',
            recurringTransactionRules: [createMockRecurringRule({ ignorePaidTopUpLimits: false })],
          })}
        />,
      )

      expect(screen.getByText(SKIP_TOPUP_LIMITS_LABEL_TRANSLATION_KEY)).toBeInTheDocument()
      // "No" twice: skip-limits row + invoice-upon-successful-payment row
      expect(screen.getAllByText(NO_TRANSLATION_KEY)).toHaveLength(2)
    })

    it('THEN hides the skip-limits row when the wallet has no limits', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [createMockRecurringRule()],
          })}
        />,
      )

      expect(screen.queryByText(SKIP_TOPUP_LIMITS_LABEL_TRANSLATION_KEY)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN a recurring rule with transaction metadata', () => {
    it('THEN shows the key/value pairs under the Metadata header', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [
              createMockRecurringRule({
                transactionMetadata: [{ key: 'cost_center', value: 'marketing' }],
              }),
            ],
          })}
        />,
      )

      expect(screen.getByText(METADATA_HEADER_TRANSLATION_KEY)).toBeInTheDocument()
      expect(screen.getByText('cost_center')).toBeInTheDocument()
      expect(screen.getByText('marketing')).toBeInTheDocument()
    })

    it('THEN hides the Metadata header when the rule has none', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [createMockRecurringRule()],
          })}
        />,
      )

      expect(screen.queryByText(METADATA_HEADER_TRANSLATION_KEY)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN a recurring rule with an expiration date', () => {
    it('THEN shows the formatted date', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [
              createMockRecurringRule({ expirationAt: '2024-06-30T00:00:00Z' }),
            ],
          })}
        />,
      )

      // Rule expiration label renders next to the wallet-level one
      expect(screen.getAllByText(RULE_EXPIRATION_LABEL_TRANSLATION_KEY)).toHaveLength(2)
      // The date-format mock returns the same date for any input; only the
      // rule has a date set here, so a single occurrence is expected
      expect(screen.getByText('2024-01-01')).toBeInTheDocument()
    })
  })

  describe('GIVEN multiple recurring rules', () => {
    it('THEN renders every rule with a numbered header', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [
              createMockRecurringRule({ lagoId: 'rule-1' }),
              createMockRecurringRule({
                lagoId: 'rule-2',
                method: RecurringTransactionMethodEnum.Target,
                grantsTargetTopUp: true,
                targetOngoingBalance: '200.0',
              }),
            ],
          })}
        />,
      )

      expect(screen.getByTestId(WALLET_INFORMATIONS_RECURRING_RULE_TEST_ID(0))).toBeInTheDocument()
      expect(screen.getByTestId(WALLET_INFORMATIONS_RECURRING_RULE_TEST_ID(1))).toBeInTheDocument()
      expect(screen.getAllByText(RULE_NUMBER_TRANSLATION_KEY)).toHaveLength(2)
      // Second rule grants free credits up to the target
      expect(screen.getByText(FREE_TOPUP_TYPE_TRANSLATION_KEY)).toBeInTheDocument()
    })

    it('THEN hides the numbered header for a single rule', () => {
      render(
        <WalletInformations
          wallet={createMockWallet({
            recurringTransactionRules: [createMockRecurringRule()],
          })}
        />,
      )

      expect(screen.queryByText(RULE_NUMBER_TRANSLATION_KEY)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN no explicitly selected invoice custom sections', () => {
    describe('WHEN the customer inherits sections from the billing entity', () => {
      it('THEN still shows the invoice custom sections (fallback), like the subscription overview', () => {
        mockCustomerIcsData = {
          configurableInvoiceCustomSections: [{ id: 'ics-1', name: 'Footer A' }],
          hasOverwrittenInvoiceCustomSectionsSelection: false,
          skipInvoiceCustomSections: false,
        }

        render(
          <WalletInformations
            wallet={createMockWallet({
              customer: { id: 'cust-1', externalId: 'ext-1' },
              selectedInvoiceCustomSections: [],
              skipInvoiceCustomSections: false,
            })}
          />,
        )

        expect(screen.getByText('Footer A')).toBeInTheDocument()
      })
    })
  })
})
