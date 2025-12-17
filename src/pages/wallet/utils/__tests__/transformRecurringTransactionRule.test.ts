import { GetWalletInfosForWalletFormQuery } from '~/generated/graphql'

import { transformRecurringTransactionRule } from '../transformRecurringTransactionRule'

type RecurringTransactionRuleFromQuery =
  NonNullable<
    NonNullable<GetWalletInfosForWalletFormQuery['wallet']>['recurringTransactionRules']
  >[number]

describe('transformRecurringTransactionRule', () => {
  const createMockRule = (
    overrides?: Partial<RecurringTransactionRuleFromQuery>,
  ): RecurringTransactionRuleFromQuery => {
    return {
      expirationAt: null,
      grantedCredits: '100',
      interval: 'monthly',
      invoiceRequiresSuccessfulPayment: false,
      lagoId: 'rule-id',
      method: 'target',
      paidCredits: '50',
      startedAt: '2024-01-01T00:00:00Z',
      targetOngoingBalance: '200',
      thresholdCredits: '150',
      transactionName: 'Test Transaction',
      trigger: 'interval',
      ignorePaidTopUpLimits: false,
      paymentMethodType: 'provider',
      paymentMethod: {
        id: 'payment-method-id',
        __typename: 'PaymentMethod',
      },
      skipInvoiceCustomSections: true,
      selectedInvoiceCustomSections: [
        { id: 'section-1', name: 'Section 1', __typename: 'InvoiceCustomSection' },
      ],
      transactionMetadata: [],
      ...overrides,
    } as RecurringTransactionRuleFromQuery
  }

  it('should exclude paymentMethodType, skipInvoiceCustomSections, and selectedInvoiceCustomSections from the main rule object', () => {
    const rule = createMockRule()
    const result = transformRecurringTransactionRule(rule)

    expect(result).not.toHaveProperty('paymentMethodType')
    expect(result).not.toHaveProperty('skipInvoiceCustomSections')
    expect(result).not.toHaveProperty('selectedInvoiceCustomSections')
  })

  it('should preserve all other fields from the original rule', () => {
    const rule = createMockRule({
      grantedCredits: '200',
      interval: 'weekly',
      transactionName: 'Custom Transaction',
    })
    const result = transformRecurringTransactionRule(rule)

    expect(result.grantedCredits).toBe('200')
    expect(result.interval).toBe('weekly')
    expect(result.transactionName).toBe('Custom Transaction')
    expect(result.lagoId).toBe('rule-id')
    expect(result.method).toBe('target')
  })

  it('should transform paymentMethodType and paymentMethod.id into paymentMethod object', () => {
    const rule = createMockRule({
      paymentMethodType: 'manual',
      paymentMethod: {
        id: 'custom-payment-id',
        __typename: 'PaymentMethod',
      },
    })
    const result = transformRecurringTransactionRule(rule)

    expect(result.paymentMethod).toEqual({
      paymentMethodType: 'manual',
      paymentMethodId: 'custom-payment-id',
    })
  })

  it('should transform selectedInvoiceCustomSections and skipInvoiceCustomSections into invoiceCustomSection object with defaults', () => {
    const ruleWithSections = createMockRule({
      selectedInvoiceCustomSections: [
        { id: 'section-1', name: 'Section 1', __typename: 'InvoiceCustomSection' },
        { id: 'section-2', name: 'Section 2', __typename: 'InvoiceCustomSection' },
      ],
      skipInvoiceCustomSections: false,
    })
    const resultWithSections = transformRecurringTransactionRule(ruleWithSections)

    expect(resultWithSections.invoiceCustomSection).toEqual({
      invoiceCustomSections: [
        { id: 'section-1', name: 'Section 1', __typename: 'InvoiceCustomSection' },
        { id: 'section-2', name: 'Section 2', __typename: 'InvoiceCustomSection' },
      ],
      skipInvoiceCustomSections: false,
    })

    const ruleWithoutSections = createMockRule({
      selectedInvoiceCustomSections: null,
      skipInvoiceCustomSections: true,
    })
    const resultWithoutSections = transformRecurringTransactionRule(ruleWithoutSections)

    expect(resultWithoutSections.invoiceCustomSection).toEqual({
      invoiceCustomSections: [],
      skipInvoiceCustomSections: true,
    })
  })
})

