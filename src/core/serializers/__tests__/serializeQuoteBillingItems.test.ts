import type { AddOnItem } from '~/components/designSystem/RichTextEditor/PricingBlock/constants'

import { type AddOnPayload, toBillingItems } from '../serializeQuoteBillingItems'

describe('toBillingItems', () => {
  const makePayload = (overrides: Partial<AddOnPayload> = {}): AddOnPayload => ({
    position: 1,
    add_on_code: 'setup',
    name: 'Setup Fee',
    description: 'One-time setup',
    units: 1,
    unit_amount_cents: 50000,
    total_amount_cents: 50000,
    invoice_display_name: 'Setup Fee',
    from_datetime: null,
    to_datetime: null,
    tax_codes: [],
    ...overrides,
  })

  const makeAddOnItem = (overrides: Partial<AddOnItem> = {}): AddOnItem => ({
    addOnId: 'addon-1',
    name: 'Setup Fee',
    invoiceDisplayName: 'Setup Fee',
    code: 'setup',
    description: 'One-time setup',
    units: '1',
    unitAmountCents: '50000',
    totalAmount: '50000',
    fromDatetime: '',
    toDatetime: '',
    ...overrides,
  })

  it('produces correct structure with no overrides', () => {
    const items: AddOnItem[] = [makeAddOnItem()]
    const payloads: Record<string, AddOnPayload> = { 'addon-1': makePayload() }

    const result = toBillingItems(items, payloads)

    expect(result).toEqual({
      addons: [
        {
          type: 'addon',
          id: 'addon-1',
          payload: { ...makePayload(), position: 1 },
          overrides: {},
        },
      ],
    })
  })

  it('detects overrides when user changes values', () => {
    const items: AddOnItem[] = [
      makeAddOnItem({
        invoiceDisplayName: 'Custom Name',
        units: '3',
        unitAmountCents: '60000',
        totalAmount: '180000',
        description: 'Custom desc',
        fromDatetime: '2026-04-01',
        toDatetime: '2026-06-30',
      }),
    ]
    const payloads: Record<string, AddOnPayload> = { 'addon-1': makePayload() }

    const result = toBillingItems(items, payloads)

    expect(result.addons[0].overrides).toEqual({
      invoice_display_name: 'Custom Name',
      units: 3,
      unit_amount_cents: 60000,
      total_amount_cents: 180000,
      description: 'Custom desc',
      from_datetime: '2026-04-01',
      to_datetime: '2026-06-30',
    })
  })

  it('assigns position based on array index', () => {
    const items: AddOnItem[] = [
      makeAddOnItem({ addOnId: 'a' }),
      makeAddOnItem({ addOnId: 'b' }),
    ]
    const payloads: Record<string, AddOnPayload> = {
      a: makePayload({ add_on_code: 'a' }),
      b: makePayload({ add_on_code: 'b' }),
    }

    const result = toBillingItems(items, payloads)

    expect(result.addons[0].payload.position).toBe(1)
    expect(result.addons[1].payload.position).toBe(2)
  })

  it('converts string form values to numbers', () => {
    const items: AddOnItem[] = [makeAddOnItem({ units: '5', unitAmountCents: '10000', totalAmount: '50001' })]
    const payloads: Record<string, AddOnPayload> = { 'addon-1': makePayload() }

    const result = toBillingItems(items, payloads)

    // units changed from 1 to 5, so it's an override
    expect(result.addons[0].overrides.units).toBe(5)
    expect(result.addons[0].overrides.unit_amount_cents).toBe(10000)
    expect(result.addons[0].overrides.total_amount_cents).toBe(50001)
  })

  it('does not include unchanged fields in overrides', () => {
    const items: AddOnItem[] = [
      makeAddOnItem({
        description: 'One-time setup', // same as payload
        invoiceDisplayName: 'Setup Fee', // same as payload
      }),
    ]
    const payloads: Record<string, AddOnPayload> = { 'addon-1': makePayload() }

    const result = toBillingItems(items, payloads)

    expect(result.addons[0].overrides).toEqual({})
  })

  it('handles empty from/to datetime (no override when payload is null)', () => {
    const items: AddOnItem[] = [makeAddOnItem({ fromDatetime: '', toDatetime: '' })]
    const payloads: Record<string, AddOnPayload> = {
      'addon-1': makePayload({ from_datetime: null, to_datetime: null }),
    }

    const result = toBillingItems(items, payloads)

    expect(result.addons[0].overrides).toEqual({})
  })
})
