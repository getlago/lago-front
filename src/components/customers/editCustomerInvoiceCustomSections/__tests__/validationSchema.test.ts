import { BehaviorType, editCustomerInvoiceCustomSectionsSchema } from '../validationSchema'

describe('editCustomerInvoiceCustomSectionsSchema', () => {
  // The regression: MultipleComboBoxField stores whole options, so the schema has to accept
  // the option shape. A plain `z.array(z.string())` rejected every selection the user made
  // and left the submit button permanently disabled.
  it('should accept the option objects the combobox stores', () => {
    const result = editCustomerInvoiceCustomSectionsSchema.safeParse({
      behavior: BehaviorType.CUSTOM_SECTIONS,
      configurableInvoiceCustomSections: [
        { value: 'section-1', label: 'Section 1' },
        { value: 'section-2', label: 'Section 2', description: 'SECTION_2' },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('should reject a selection of bare id strings', () => {
    const result = editCustomerInvoiceCustomSectionsSchema.safeParse({
      behavior: BehaviorType.CUSTOM_SECTIONS,
      configurableInvoiceCustomSections: ['section-1'],
    })

    expect(result.success).toBe(false)
  })

  it('should reject CUSTOM_SECTIONS without any section', () => {
    const result = editCustomerInvoiceCustomSectionsSchema.safeParse({
      behavior: BehaviorType.CUSTOM_SECTIONS,
      configurableInvoiceCustomSections: [],
    })

    expect(result.success).toBe(false)
  })

  it.each([
    ['FALLBACK', BehaviorType.FALLBACK],
    ['DEACTIVATE', BehaviorType.DEACTIVATE],
  ])('should allow an empty selection for %s', (_, behavior) => {
    const result = editCustomerInvoiceCustomSectionsSchema.safeParse({
      behavior,
      configurableInvoiceCustomSections: [],
    })

    expect(result.success).toBe(true)
  })
})
