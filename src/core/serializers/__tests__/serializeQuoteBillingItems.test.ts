import type { AddOnItem } from '~/components/designSystem/RichTextEditor/PricingBlock/constants'
import { CurrencyEnum } from '~/generated/graphql'

import {
  type AddOnPayload,
  type BillingItemsPayload,
  buildPreviewEntities,
  fromBillingItems,
  toBillingItems,
} from '../serializeQuoteBillingItems'

describe('toBillingItems', () => {
  const makePayload = (overrides: Partial<AddOnPayload> = {}): AddOnPayload => ({
    position: 1,
    code: 'setup',
    name: 'Setup Fee',
    description: 'One-time setup',
    units: 1,
    unitAmountCents: 50000,
    totalAmountCents: 50000,
    invoiceDisplayName: 'Setup Fee',
    fromDatetime: null,
    toDatetime: null,
    taxCodes: [],
    ...overrides,
  })

  // Form fields hold currency units ($500), the payload holds cents (50000).
  const makeAddOnItem = (overrides: Partial<AddOnItem> = {}): AddOnItem => ({
    localId: 'local-1',
    addOnId: 'addon-1',
    name: 'Setup Fee',
    invoiceDisplayName: 'Setup Fee',
    code: 'setup',
    description: 'One-time setup',
    units: '1',
    unitAmountCents: '500',
    totalAmount: '500',
    fromDatetime: '',
    toDatetime: '',
    ...overrides,
  })

  it('produces correct structure with no overrides', () => {
    const items: AddOnItem[] = [makeAddOnItem()]
    const payloads: Record<string, AddOnPayload> = { 'local-1': makePayload() }

    const result = toBillingItems(items, payloads)

    expect(result).toEqual({
      addOns: [
        {
          type: 'add_on',
          id: 'addon-1',
          localId: 'local-1',
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
        unitAmountCents: '600',
        totalAmount: '1800',
        description: 'Custom desc',
        fromDatetime: '2026-04-01',
        toDatetime: '2026-06-30',
      }),
    ]
    const payloads: Record<string, AddOnPayload> = { 'local-1': makePayload() }

    const result = toBillingItems(items, payloads)

    expect(result.addOns[0].overrides).toEqual({
      invoiceDisplayName: 'Custom Name',
      units: 3,
      unitAmountCents: 60000,
      totalAmountCents: 180000,
      description: 'Custom desc',
      fromDatetime: '2026-04-01',
      toDatetime: '2026-06-30',
    })
  })

  it('assigns position based on array index', () => {
    const items: AddOnItem[] = [
      makeAddOnItem({ localId: 'local-a', addOnId: 'a' }),
      makeAddOnItem({ localId: 'local-b', addOnId: 'b' }),
    ]
    const payloads: Record<string, AddOnPayload> = {
      'local-a': makePayload({ code: 'a' }),
      'local-b': makePayload({ code: 'b' }),
    }

    const result = toBillingItems(items, payloads)

    expect(result.addOns[0].payload.position).toBe(1)
    expect(result.addOns[1].payload.position).toBe(2)
  })

  it('converts string form values (currency units) to cents numbers', () => {
    const items: AddOnItem[] = [
      makeAddOnItem({ units: '5', unitAmountCents: '100', totalAmount: '500.01' }),
    ]
    const payloads: Record<string, AddOnPayload> = { 'local-1': makePayload() }

    const result = toBillingItems(items, payloads)

    // units changed from 1 to 5, so it's an override
    expect(result.addOns[0].overrides.units).toBe(5)
    expect(result.addOns[0].overrides.unitAmountCents).toBe(10000)
    expect(result.addOns[0].overrides.totalAmountCents).toBe(50001)
  })

  it('does not include unchanged fields in overrides', () => {
    const items: AddOnItem[] = [
      makeAddOnItem({
        description: 'One-time setup', // same as payload
        invoiceDisplayName: 'Setup Fee', // same as payload
      }),
    ]
    const payloads: Record<string, AddOnPayload> = { 'local-1': makePayload() }

    const result = toBillingItems(items, payloads)

    expect(result.addOns[0].overrides).toEqual({})
  })

  it('handles empty from/to datetime (no override when payload is null)', () => {
    const items: AddOnItem[] = [makeAddOnItem({ fromDatetime: '', toDatetime: '' })]
    const payloads: Record<string, AddOnPayload> = {
      'local-1': makePayload({ fromDatetime: null, toDatetime: null }),
    }

    const result = toBillingItems(items, payloads)

    expect(result.addOns[0].overrides).toEqual({})
  })

  it('handles duplicate addOnIds with different localIds', () => {
    const items: AddOnItem[] = [
      makeAddOnItem({ localId: 'local-x', addOnId: 'addon-1', units: '2' }),
      makeAddOnItem({ localId: 'local-y', addOnId: 'addon-1', units: '5' }),
    ]
    const payloads: Record<string, AddOnPayload> = {
      'local-x': makePayload(),
      'local-y': makePayload(),
    }

    const result = toBillingItems(items, payloads)

    expect(result.addOns).toHaveLength(2)
    // Both use the same catalog ID
    expect(result.addOns[0].id).toBe('addon-1')
    expect(result.addOns[1].id).toBe('addon-1')
    // Each has its own position
    expect(result.addOns[0].payload.position).toBe(1)
    expect(result.addOns[1].payload.position).toBe(2)
    // Each has independent overrides based on its own localId payload
    expect(result.addOns[0].overrides.units).toBe(2)
    expect(result.addOns[1].overrides.units).toBe(5)
  })
})

describe('fromBillingItems', () => {
  let uuidCounter: number

  beforeEach(() => {
    uuidCounter = 0
    jest.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      uuidCounter++

      return `mock-uuid-${uuidCounter}` as ReturnType<typeof crypto.randomUUID>
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const makeBillingItems = (): BillingItemsPayload => ({
    addOns: [
      {
        type: 'add_on',
        id: 'addon-1',
        payload: {
          position: 1,
          code: 'setup',
          name: 'Setup Fee',
          description: 'One-time setup',
          units: 1,
          unitAmountCents: 50000,
          totalAmountCents: 50000,
          invoiceDisplayName: 'Setup Fee',
          fromDatetime: null,
          toDatetime: null,
          taxCodes: [],
        },
        overrides: {},
      },
    ],
  })

  it('reconstructs entities keyed by localId from payload with no overrides', () => {
    const result = fromBillingItems(makeBillingItems(), CurrencyEnum.Usd)

    const localId = result.addOnItems[0].localId

    expect(localId).toBe('mock-uuid-1')
    expect(result.entities[localId]).toEqual({
      entityId: localId,
      entityType: 'addOn',
      name: 'Setup Fee',
      invoiceDisplayName: 'Setup Fee',
      code: 'setup',
      description: 'One-time setup',
      units: '1',
      unitAmountCents: '500',
      totalAmount: '500',
      fromDatetime: '',
      toDatetime: '',
    })
  })

  it('merges overrides onto payload for effective values', () => {
    const billingItems: BillingItemsPayload = {
      addOns: [
        {
          type: 'add_on',
          id: 'addon-1',
          payload: {
            position: 1,
            code: 'setup',
            name: 'Setup Fee',
            description: 'One-time setup',
            units: 1,
            unitAmountCents: 50000,
            totalAmountCents: 50000,
            invoiceDisplayName: 'Setup Fee',
            fromDatetime: null,
            toDatetime: null,
            taxCodes: [],
          },
          overrides: {
            invoiceDisplayName: 'Custom Name',
            units: 3,
            unitAmountCents: 60000,
            totalAmountCents: 180000,
            fromDatetime: '2026-04-01',
            toDatetime: '2026-06-30',
          },
        },
      ],
    }

    const result = fromBillingItems(billingItems, CurrencyEnum.Usd)

    const localId = result.addOnItems[0].localId

    expect(result.entities[localId].invoiceDisplayName).toBe('Custom Name')
    expect(result.entities[localId].units).toBe('3')
    expect(result.entities[localId].unitAmountCents).toBe('600')
    expect(result.entities[localId].totalAmount).toBe('1800')
    expect(result.entities[localId].fromDatetime).toBe('2026-04-01')
    expect(result.entities[localId].toDatetime).toBe('2026-06-30')
  })

  it('reconstructs addOnItems with localId and addOnId for form state', () => {
    const result = fromBillingItems(makeBillingItems(), CurrencyEnum.Usd)

    expect(result.addOnItems).toEqual([
      {
        localId: 'mock-uuid-1',
        addOnId: 'addon-1',
        name: 'Setup Fee',
        invoiceDisplayName: 'Setup Fee',
        code: 'setup',
        description: 'One-time setup',
        units: '1',
        unitAmountCents: '500',
        totalAmount: '500',
        fromDatetime: '',
        toDatetime: '',
      },
    ])
  })

  it('preserves original payloads keyed by localId for future diff', () => {
    const billingItems = makeBillingItems()
    const result = fromBillingItems(billingItems)

    const localId = result.addOnItems[0].localId

    expect(result.originalPayloads[localId]).toEqual(billingItems.addOns?.[0].payload)
  })

  it('sorts by position', () => {
    const billingItems: BillingItemsPayload = {
      addOns: [
        {
          type: 'add_on',
          id: 'addon-b',
          payload: {
            position: 2,
            code: 'b',
            name: 'B',
            description: '',
            units: 1,
            unitAmountCents: 100,
            totalAmountCents: 100,
            invoiceDisplayName: 'B',
            fromDatetime: null,
            toDatetime: null,
            taxCodes: [],
          },
          overrides: {},
        },
        {
          type: 'add_on',
          id: 'addon-a',
          payload: {
            position: 1,
            code: 'a',
            name: 'A',
            description: '',
            units: 1,
            unitAmountCents: 200,
            totalAmountCents: 200,
            invoiceDisplayName: 'A',
            fromDatetime: null,
            toDatetime: null,
            taxCodes: [],
          },
          overrides: {},
        },
      ],
    }

    const result = fromBillingItems(billingItems)

    expect(result.addOnItems[0].addOnId).toBe('addon-a')
    expect(result.addOnItems[1].addOnId).toBe('addon-b')
  })

  it('handles empty addons array', () => {
    const result = fromBillingItems({ addOns: [] })

    expect(result.entities).toEqual({})
    expect(result.addOnItems).toEqual([])
    expect(result.originalPayloads).toEqual({})
  })

  it('handles duplicate addOnIds as separate entries with unique localIds', () => {
    const billingItems: BillingItemsPayload = {
      addOns: [
        {
          type: 'add_on',
          id: 'addon-1',
          payload: {
            position: 1,
            code: 'setup',
            name: 'Setup Fee',
            description: 'One-time setup',
            units: 1,
            unitAmountCents: 50000,
            totalAmountCents: 50000,
            invoiceDisplayName: 'Setup Fee',
            fromDatetime: null,
            toDatetime: null,
            taxCodes: [],
          },
          overrides: {},
        },
        {
          type: 'add_on',
          id: 'addon-1',
          payload: {
            position: 2,
            code: 'setup',
            name: 'Setup Fee',
            description: 'One-time setup',
            units: 3,
            unitAmountCents: 50000,
            totalAmountCents: 150000,
            invoiceDisplayName: 'Setup Fee',
            fromDatetime: null,
            toDatetime: null,
            taxCodes: [],
          },
          overrides: { units: 5 },
        },
      ],
    }

    const result = fromBillingItems(billingItems)

    // Both items share the same addOnId but have distinct localIds
    expect(result.addOnItems).toHaveLength(2)
    expect(result.addOnItems[0].addOnId).toBe('addon-1')
    expect(result.addOnItems[1].addOnId).toBe('addon-1')
    expect(result.addOnItems[0].localId).toBe('mock-uuid-1')
    expect(result.addOnItems[1].localId).toBe('mock-uuid-2')

    // Each entry is keyed separately in entities and originalPayloads
    const localId1 = result.addOnItems[0].localId
    const localId2 = result.addOnItems[1].localId

    expect(result.entities[localId1]).toBeDefined()
    expect(result.entities[localId2]).toBeDefined()
    expect(result.entities[localId1].units).toBe('1')
    expect(result.entities[localId2].units).toBe('5') // override applied

    expect(result.originalPayloads[localId1]).toBeDefined()
    expect(result.originalPayloads[localId2]).toBeDefined()
    expect(result.originalPayloads[localId1]).not.toBe(result.originalPayloads[localId2])
  })
})

describe('buildPreviewEntities', () => {
  let uuidCounter: number

  beforeEach(() => {
    uuidCounter = 0
    jest.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      uuidCounter++

      return `mock-uuid-${uuidCounter}` as ReturnType<typeof crypto.randomUUID>
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const makeBillingItems = (
    overrides: Partial<NonNullable<BillingItemsPayload['addOns']>[number]> = {},
  ): BillingItemsPayload => ({
    addOns: [
      {
        type: 'add_on',
        id: 'addon-1',
        payload: {
          position: 1,
          code: 'setup',
          name: 'Setup Fee',
          description: 'One-time setup',
          units: 1,
          unitAmountCents: 50000,
          totalAmountCents: 50000,
          invoiceDisplayName: 'Setup Fee',
          fromDatetime: null,
          toDatetime: null,
          taxCodes: [],
        },
        overrides: {},
        ...overrides,
      },
    ],
  })

  it('keys entities by both localId and catalog addOnId so legacy content blocks resolve', () => {
    // Content blocks that predate localEntityIds reference add-ons by catalog
    // entityIds; the preview must resolve them even when no localId is persisted.
    const entities = buildPreviewEntities(makeBillingItems())

    const localId = 'mock-uuid-1'

    expect(entities[localId]).toBeDefined()
    expect(entities['addon-1']).toBeDefined()
    expect(entities['addon-1']).toEqual(entities[localId])
    expect(entities['addon-1'].name).toBe('Setup Fee')
  })

  it('keys entities by saved localId and catalog addOnId when localId is persisted', () => {
    const entities = buildPreviewEntities(makeBillingItems({ localId: 'saved-local-1' }))

    expect(entities['saved-local-1']).toBeDefined()
    expect(entities['addon-1']).toEqual(entities['saved-local-1'])
  })

  it('returns an empty map for no addons', () => {
    expect(buildPreviewEntities({ addOns: [] })).toEqual({})
  })

  it('includes the plan entity (with PlanPreviewData) when billingItems.plans is present, alongside addons', () => {
    const billingItems = {
      addOns: [], // keep empty or reuse an existing addon fixture from this suite
      plans: [
        {
          type: 'plan',
          id: 'plan-1',
          overrides: {},
          payload: {
            position: 0,
            code: 'p',
            name: 'P',
            description: '',
            subscriptionExternalId: null,
            subscriptionName: null,
            billingTime: 'calendar',
            startDate: null,
            endDate: null,
            paymentMethodId: null,
            invoiceCustomFooter: null,
            interval: 'monthly',
            amountCents: '13050',
            amountCurrency: 'USD',
            payInAdvance: true,
            charges: [],
            fixedCharges: [],
            minimumCommitment: null,
          },
        },
      ],
    } as any

    const entities = buildPreviewEntities(billingItems)

    expect(entities['plan-1']).toBeDefined()
    expect(entities['plan-1'].entityType).toBe('plan')
    expect(entities['plan-1'].plan?.rows.length).toBeGreaterThan(0)
  })

  it('includes wallet entities (with WalletPreviewData) from walletCredits, keyed by localId', () => {
    const billingItems = {
      addOns: [],
      walletCredits: [
        {
          type: 'wallet_credit',
          localId: 'wallet-local-1',
          payload: {
            position: 0,
            name: 'Prepaid credits',
            currency: 'USD',
            rateAmount: '1',
            paidCredits: '100',
            grantedCredits: '20',
            expirationAt: null,
            priority: 50,
            invoiceRequiresSuccessfulPayment: false,
            paidTopUpMinAmountCents: null,
            paidTopUpMaxAmountCents: null,
            purchaseOrderNumber: null,
            metadata: [],
            appliesTo: { feeTypes: [], billableMetricCodes: [] },
            recurringTransactionRules: [],
          },
        },
      ],
    } as any

    const entities = buildPreviewEntities(billingItems)

    expect(entities['wallet-local-1']).toBeDefined()
    expect(entities['wallet-local-1'].entityType).toBe('wallet')
    // paid (100) + free (20) rows
    expect(entities['wallet-local-1'].wallet?.rows.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Amount serialization: form holds currency units, payload holds cents
// ---------------------------------------------------------------------------

describe('add-on amount cents conversion', () => {
  // Catalog baseline stored in cents: $500 → 50000
  const makeCentsPayload = (overrides: Partial<AddOnPayload> = {}): AddOnPayload => ({
    position: 1,
    code: 'setup',
    name: 'Setup Fee',
    description: 'One-time setup',
    units: 1,
    unitAmountCents: 50000,
    totalAmountCents: 50000,
    invoiceDisplayName: 'Setup Fee',
    fromDatetime: null,
    toDatetime: null,
    taxCodes: [],
    ...overrides,
  })

  // Form fields hold currency units: $500 → "500"
  const makeUnitsItem = (overrides: Partial<AddOnItem> = {}): AddOnItem => ({
    localId: 'local-1',
    addOnId: 'addon-1',
    name: 'Setup Fee',
    invoiceDisplayName: 'Setup Fee',
    code: 'setup',
    description: 'One-time setup',
    units: '1',
    unitAmountCents: '500',
    totalAmount: '500',
    fromDatetime: '',
    toDatetime: '',
    ...overrides,
  })

  it('serializes currency-unit form amounts into cents overrides', () => {
    const items: AddOnItem[] = [
      makeUnitsItem({ units: '3', unitAmountCents: '600', totalAmount: '1800' }),
    ]
    const payloads: Record<string, AddOnPayload> = { 'local-1': makeCentsPayload() }

    const result = toBillingItems(items, payloads, CurrencyEnum.Usd)

    expect(result.addOns[0].overrides.unitAmountCents).toBe(60000)
    expect(result.addOns[0].overrides.totalAmountCents).toBe(180000)
  })

  it('emits no amount override when the unit-value form input equals the cents baseline', () => {
    const items: AddOnItem[] = [makeUnitsItem()]
    const payloads: Record<string, AddOnPayload> = { 'local-1': makeCentsPayload() }

    const result = toBillingItems(items, payloads, CurrencyEnum.Usd)

    expect(result.addOns[0].overrides).toEqual({})
  })

  it('respects zero-decimal currency precision (no ×100)', () => {
    // JPY has 0 decimals: form "600" → 600 cents (unchanged)
    const items: AddOnItem[] = [makeUnitsItem({ unitAmountCents: '600', totalAmount: '600' })]
    const payloads: Record<string, AddOnPayload> = {
      'local-1': makeCentsPayload({ unitAmountCents: 500, totalAmountCents: 500 }),
    }

    const result = toBillingItems(items, payloads, CurrencyEnum.Jpy)

    expect(result.addOns[0].overrides.unitAmountCents).toBe(600)
  })

  it('deserializes cents payload back into currency units for form and preview', () => {
    const billingItems: BillingItemsPayload = {
      addOns: [
        {
          type: 'add_on',
          id: 'addon-1',
          localId: 'local-1',
          payload: makeCentsPayload(),
          overrides: {},
        },
      ],
    }

    const result = fromBillingItems(billingItems, CurrencyEnum.Usd)

    expect(result.addOnItems[0].unitAmountCents).toBe('500')
    expect(result.addOnItems[0].totalAmount).toBe('500')
    expect(result.entities['local-1'].unitAmountCents).toBe('500')
    expect(result.entities['local-1'].totalAmount).toBe('500')
  })

  it('leaves amounts empty when no currency is provided (no default-USD scaling)', () => {
    const billingItems: BillingItemsPayload = {
      addOns: [
        {
          type: 'add_on',
          id: 'addon-1',
          localId: 'local-1',
          payload: makeCentsPayload(),
          overrides: {},
        },
      ],
    }

    const result = fromBillingItems(billingItems)

    expect(result.addOnItems[0].unitAmountCents).toBe('')
    expect(result.addOnItems[0].totalAmount).toBe('')
    expect(result.entities['local-1'].unitAmountCents).toBe('')
    expect(result.entities['local-1'].totalAmount).toBe('')
  })

  it('round-trips units → cents → units', () => {
    const items: AddOnItem[] = [
      makeUnitsItem({
        localId: 'local-1',
        units: '2',
        unitAmountCents: '600',
        totalAmount: '1200',
      }),
    ]
    const payloads: Record<string, AddOnPayload> = { 'local-1': makeCentsPayload() }

    const serialized = toBillingItems(items, payloads, CurrencyEnum.Usd)
    const deserialized = fromBillingItems(serialized, CurrencyEnum.Usd)

    expect(deserialized.addOnItems[0].unitAmountCents).toBe('600')
    expect(deserialized.addOnItems[0].totalAmount).toBe('1200')
  })
})
