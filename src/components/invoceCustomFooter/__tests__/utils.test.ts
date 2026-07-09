import { CustomerInvoiceCustomSectionsData } from '~/hooks/useCustomerInvoiceCustomSections'

import { createInvoiceCustomSection } from './factories/invoiceCustomSectionFactory'

import {
  computeInvoiceCustomSectionsDisplayState,
  hasInvoiceCustomSectionsContent,
  toInvoiceCustomSectionReference,
} from '../utils'

describe('WHEN toInvoiceCustomSectionReference is called', () => {
  it('THEN returns undefined when input is undefined', () => {
    expect(toInvoiceCustomSectionReference(undefined)).toBeUndefined()
  })

  it('THEN returns undefined when input is null', () => {
    expect(toInvoiceCustomSectionReference(null)).toBeUndefined()
  })

  it('THEN converts invoiceCustomSections to invoiceCustomSectionIds', () => {
    const input = {
      invoiceCustomSections: [
        { id: 'section-1', name: 'Section 1' },
        { id: 'section-2', name: 'Section 2' },
      ],
      skipInvoiceCustomSections: false,
    }

    const result = toInvoiceCustomSectionReference(input)

    expect(result).toEqual({
      invoiceCustomSectionIds: ['section-1', 'section-2'],
      skipInvoiceCustomSections: false,
    })
  })

  it('THEN returns empty array when invoiceCustomSections is empty', () => {
    const input = {
      invoiceCustomSections: [],
      skipInvoiceCustomSections: false,
    }

    const result = toInvoiceCustomSectionReference(input)

    expect(result).toEqual({
      invoiceCustomSectionIds: [],
      skipInvoiceCustomSections: false,
    })
  })

  it('THEN returns empty array when invoiceCustomSections is undefined', () => {
    const input = {
      invoiceCustomSections: undefined as never,
      skipInvoiceCustomSections: true,
    }

    const result = toInvoiceCustomSectionReference(input)

    expect(result).toEqual({
      invoiceCustomSectionIds: [],
      skipInvoiceCustomSections: true,
    })
  })

  it('THEN preserves skipInvoiceCustomSections value', () => {
    const inputWithSkip = {
      invoiceCustomSections: [{ id: 'section-1', name: 'Section 1' }],
      skipInvoiceCustomSections: true,
    }

    const inputWithoutSkip = {
      invoiceCustomSections: [{ id: 'section-1', name: 'Section 1' }],
      skipInvoiceCustomSections: false,
    }

    expect(toInvoiceCustomSectionReference(inputWithSkip)?.skipInvoiceCustomSections).toBe(true)
    expect(toInvoiceCustomSectionReference(inputWithoutSkip)?.skipInvoiceCustomSections).toBe(false)
  })
})

describe('hasInvoiceCustomSectionsContent', () => {
  const createCustomerIcsData = (
    overrides: Partial<CustomerInvoiceCustomSectionsData> = {},
  ): CustomerInvoiceCustomSectionsData => ({
    configurableInvoiceCustomSections: [],
    hasOverwrittenInvoiceCustomSectionsSelection: false,
    skipInvoiceCustomSections: false,
    ...overrides,
  })

  describe('GIVEN the entity explicitly skips invoice custom sections', () => {
    it('THEN returns true regardless of customer data', () => {
      expect(
        hasInvoiceCustomSectionsContent({
          skipInvoiceCustomSections: true,
          customerIcsData: null,
        }),
      ).toBe(true)
    })
  })

  describe('GIVEN the entity has an explicit section selection', () => {
    it('THEN returns true regardless of customer data', () => {
      expect(
        hasInvoiceCustomSectionsContent({
          skipInvoiceCustomSections: false,
          selectedInvoiceCustomSections: [createInvoiceCustomSection()],
          customerIcsData: null,
        }),
      ).toBe(true)
    })
  })

  describe('GIVEN no explicit selection or skip on the entity', () => {
    it('THEN returns false when there is no customer data to inherit from', () => {
      expect(
        hasInvoiceCustomSectionsContent({
          skipInvoiceCustomSections: false,
          selectedInvoiceCustomSections: [],
          customerIcsData: null,
        }),
      ).toBe(false)
    })

    describe('WHEN falling back to customer-level data', () => {
      it.each([
        {
          scenario: 'customer skips without overwriting (billing-entity skip inherited)',
          customerIcsData: { skipInvoiceCustomSections: true },
          expected: true,
        },
        {
          scenario: 'customer skips with an overwritten selection',
          customerIcsData: {
            skipInvoiceCustomSections: true,
            hasOverwrittenInvoiceCustomSectionsSelection: true,
          },
          expected: false,
        },
        {
          scenario: 'customer provides configurable sections without skipping',
          customerIcsData: {
            configurableInvoiceCustomSections: [createInvoiceCustomSection()],
          },
          expected: true,
        },
        {
          scenario: 'customer has no sections and does not skip',
          customerIcsData: {},
          expected: false,
        },
      ])('THEN returns $expected when $scenario', ({ customerIcsData, expected }) => {
        expect(
          hasInvoiceCustomSectionsContent({
            skipInvoiceCustomSections: false,
            selectedInvoiceCustomSections: [],
            customerIcsData: createCustomerIcsData(customerIcsData),
          }),
        ).toBe(expected)
      })
    })
  })
})

describe('computeInvoiceCustomSectionsDisplayState', () => {
  const createCustomerIcsData = (
    overrides: Partial<CustomerInvoiceCustomSectionsData> = {},
  ): CustomerInvoiceCustomSectionsData => ({
    configurableInvoiceCustomSections: [],
    hasOverwrittenInvoiceCustomSectionsSelection: false,
    skipInvoiceCustomSections: false,
    ...overrides,
  })

  describe('GIVEN the entity explicitly skips sections', () => {
    it('THEN returns none even when a selection exists', () => {
      expect(
        computeInvoiceCustomSectionsDisplayState({
          skipSections: true,
          selectedSections: [createInvoiceCustomSection()],
          customerIcsData: null,
        }),
      ).toEqual({ type: 'none' })
    })
  })

  describe('GIVEN the entity has an explicit selection', () => {
    it('THEN returns apply with the selected sections', () => {
      const sections = [createInvoiceCustomSection()]

      expect(
        computeInvoiceCustomSectionsDisplayState({
          selectedSections: sections,
          skipSections: false,
          customerIcsData: null,
        }),
      ).toEqual({ type: 'apply', sections })
    })
  })

  describe('GIVEN no explicit selection or skip', () => {
    it('THEN returns fallback_empty without customer data', () => {
      expect(
        computeInvoiceCustomSectionsDisplayState({
          selectedSections: [],
          skipSections: false,
          customerIcsData: null,
        }),
      ).toEqual({ type: 'fallback_empty' })
    })

    it.each([
      {
        scenario: 'customer skips without overwriting',
        customerIcsData: { skipInvoiceCustomSections: true },
        expectedType: 'fallback_customer_skip',
      },
      {
        scenario: 'customer overwrote the selection with sections',
        customerIcsData: {
          hasOverwrittenInvoiceCustomSectionsSelection: true,
          configurableInvoiceCustomSections: [createInvoiceCustomSection()],
        },
        expectedType: 'fallback_customer_sections',
      },
      {
        scenario: 'sections are inherited from the billing entity',
        customerIcsData: {
          configurableInvoiceCustomSections: [createInvoiceCustomSection()],
        },
        expectedType: 'fallback_billing_entity',
      },
      {
        scenario: 'customer has no sections and does not skip',
        customerIcsData: {},
        expectedType: 'fallback_empty',
      },
      {
        scenario: 'customer skips with an overwritten selection',
        customerIcsData: {
          skipInvoiceCustomSections: true,
          hasOverwrittenInvoiceCustomSectionsSelection: true,
        },
        expectedType: 'fallback_empty',
      },
      {
        // pins the `sections.length > 0` guard: an overwrite with no sections
        // must NOT surface fallback_customer_sections with an empty chip list
        scenario: 'customer overwrote the selection but has no sections',
        customerIcsData: {
          hasOverwrittenInvoiceCustomSectionsSelection: true,
          configurableInvoiceCustomSections: [],
        },
        expectedType: 'fallback_empty',
      },
      {
        // pins the `!customerSkipSections` guard: a skip-with-overwrite must NOT
        // surface sections the customer explicitly skipped
        scenario: 'customer skips with an overwritten selection that still has sections',
        customerIcsData: {
          skipInvoiceCustomSections: true,
          hasOverwrittenInvoiceCustomSectionsSelection: true,
          configurableInvoiceCustomSections: [createInvoiceCustomSection()],
        },
        expectedType: 'fallback_empty',
      },
    ])('THEN returns $expectedType when $scenario', ({ customerIcsData, expectedType }) => {
      expect(
        computeInvoiceCustomSectionsDisplayState({
          selectedSections: [],
          skipSections: false,
          customerIcsData: createCustomerIcsData(customerIcsData),
        }).type,
      ).toBe(expectedType)
    })
  })
})
