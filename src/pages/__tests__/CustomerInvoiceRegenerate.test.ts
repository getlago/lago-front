/**
 * Unit tests for the fee management logic in CustomerInvoiceRegenerate page.
 * These tests verify the fix for ISSUE-1556 and related Apollo cache pollution bugs.
 *
 * Key scenarios tested:
 * 1. Deep cloning of original fees to prevent Apollo cache pollution
 * 2. Fee reset functionality using the preserved original data
 * 3. Fee update/add logic
 */

describe('CustomerInvoiceRegenerate - Fee Management Logic', () => {
  /**
   * Simulates the fee reset logic from CustomerInvoiceRegenerate.tsx
   * This is extracted to test the core logic independently of React hooks
   */
  const createFeeResetHandler = (originalFees: any[]) => {
    // Deep clone to simulate what originalFeesRef stores
    const originalFeesClone = JSON.parse(JSON.stringify(originalFees))

    return {
      originalFeesClone,
      onDelete: (id: string, currentFees: any[]) => {
        const original = originalFeesClone.find((f: any) => f.id === id)

        if (original && !original.adjustedFee) {
          return currentFees.map((fee) => (fee.id === id ? original : fee))
        }

        return currentFees.filter((fee) => fee.id !== id)
      },
    }
  }

  describe('Deep clone behavior (Apollo cache pollution fix)', () => {
    it('should create an independent copy of original fees', () => {
      const originalFees = [
        {
          id: 'fee-1',
          invoiceDisplayName: 'API Calls',
          charge: { billableMetric: { name: 'API Calls Metric' } },
          subscription: { id: 'sub-1' },
        },
      ]

      const { originalFeesClone } = createFeeResetHandler(originalFees)

      // Modify the "Apollo cache" (original array)
      originalFees[0].invoiceDisplayName = 'CORRUPTED BY CACHE'
      originalFees[0].charge.billableMetric.name = 'CORRUPTED METRIC'

      // The clone should remain unchanged
      expect(originalFeesClone[0].invoiceDisplayName).toBe('API Calls')
      expect(originalFeesClone[0].charge.billableMetric.name).toBe('API Calls Metric')
    })

    it('should preserve deeply nested subscription data', () => {
      const originalFees = [
        {
          id: 'fee-1',
          subscription: {
            id: 'sub-1',
            plan: {
              id: 'plan-1',
              name: 'Premium Plan',
              interval: 'monthly',
            },
          },
        },
      ]

      const { originalFeesClone } = createFeeResetHandler(originalFees)

      // Simulate Apollo cache pollution with partial subscription data
      originalFees[0].subscription = { id: 'sub-1' } as any // Plan data lost!

      // The clone should preserve the full subscription data
      expect(originalFeesClone[0].subscription.plan).toBeDefined()
      expect(originalFeesClone[0].subscription.plan.name).toBe('Premium Plan')
      expect(originalFeesClone[0].subscription.plan.interval).toBe('monthly')
    })

    it('should preserve charge and billable metric data needed for display names', () => {
      const originalFees = [
        {
          id: 'fee-1',
          invoiceName: 'Storage Usage',
          charge: {
            id: 'charge-1',
            chargeModel: 'standard',
            billableMetric: {
              id: 'metric-1',
              name: 'Storage',
              recurring: true,
            },
          },
          chargeFilter: {
            id: 'filter-1',
            invoiceDisplayName: 'Premium Tier',
            values: { tier: ['premium'] },
          },
          groupedBy: { region: 'US-East' },
        },
      ]

      const { originalFeesClone } = createFeeResetHandler(originalFees)

      // Simulate cache pollution
      originalFees[0].charge.billableMetric = { id: 'metric-1' } as any
      originalFees[0].chargeFilter = null as any

      // Clone should be intact
      expect(originalFeesClone[0].charge.billableMetric.name).toBe('Storage')
      expect(originalFeesClone[0].chargeFilter.invoiceDisplayName).toBe('Premium Tier')
    })
  })

  describe('Fee reset functionality', () => {
    it('should restore original fee when resetting an edited (non-adjusted) fee', () => {
      const originalFees = [
        {
          id: 'fee-1',
          invoiceDisplayName: 'Original Name',
          units: 10,
          adjustedFee: false,
        },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      // Current state has the fee edited via previewAdjustedFee
      const currentFees = [
        {
          id: 'fee-1',
          invoiceDisplayName: 'Edited Name',
          units: 20,
          adjustedFee: true, // Marked as adjusted by the edit
        },
      ]

      // Reset the fee
      const result = onDelete('fee-1', currentFees)

      // Should restore the original fee
      expect(result).toHaveLength(1)
      expect(result[0].invoiceDisplayName).toBe('Original Name')
      expect(result[0].units).toBe(10)
      expect(result[0].adjustedFee).toBe(false)
    })

    it('should remove fee that was originally adjusted (delete operation)', () => {
      const originalFees = [
        {
          id: 'fee-1',
          invoiceDisplayName: 'Fee 1',
          adjustedFee: true, // Was already adjusted in original data
        },
        {
          id: 'fee-2',
          invoiceDisplayName: 'Fee 2',
          adjustedFee: false,
        },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      const currentFees = [...originalFees]

      // Delete the originally adjusted fee
      const result = onDelete('fee-1', currentFees)

      // Should remove the fee completely
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('fee-2')
    })

    it('should remove newly added fees (temporary IDs)', () => {
      const originalFees = [{ id: 'fee-1', invoiceDisplayName: 'Original Fee', adjustedFee: false }]

      const { onDelete, originalFeesClone } = createFeeResetHandler(originalFees)

      // Current state includes a newly added fee
      const currentFees = [
        { id: 'fee-1', invoiceDisplayName: 'Original Fee', adjustedFee: false },
        { id: 'temporary-id-fee-123', invoiceDisplayName: 'New Fee', adjustedFee: true },
      ]

      // Delete the new fee (not in original)
      const result = onDelete('temporary-id-fee-123', currentFees)

      // New fee not found in originalFeesClone, so it gets filtered out
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('fee-1')

      // Verify the original didn't have this fee
      expect(originalFeesClone.find((f: any) => f.id === 'temporary-id-fee-123')).toBeUndefined()
    })

    it('should preserve other fees when resetting one fee', () => {
      const originalFees = [
        { id: 'fee-1', invoiceDisplayName: 'Fee 1', units: 10, adjustedFee: false },
        { id: 'fee-2', invoiceDisplayName: 'Fee 2', units: 20, adjustedFee: false },
        { id: 'fee-3', invoiceDisplayName: 'Fee 3', units: 30, adjustedFee: false },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      // Edit fee-2
      const currentFees = [
        { id: 'fee-1', invoiceDisplayName: 'Fee 1', units: 10, adjustedFee: false },
        { id: 'fee-2', invoiceDisplayName: 'Edited Fee 2', units: 100, adjustedFee: true },
        { id: 'fee-3', invoiceDisplayName: 'Fee 3', units: 30, adjustedFee: false },
      ]

      // Reset only fee-2
      const result = onDelete('fee-2', currentFees)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual(currentFees[0]) // Unchanged
      expect(result[1].invoiceDisplayName).toBe('Fee 2') // Restored
      expect(result[1].units).toBe(20) // Restored
      expect(result[2]).toEqual(currentFees[2]) // Unchanged
    })
  })

  describe('Display name preservation after reset', () => {
    /**
     * This test verifies the fix for the bug where display names showed incorrectly
     * after resetting a fee (e.g., showing "premium thing" instead of correct name)
     */
    it('should preserve all fields needed for display name generation after reset', () => {
      const originalFees = [
        {
          id: 'fee-1',
          feeType: 'charge',
          invoiceDisplayName: null, // Falls back to charge.billableMetric.name
          invoiceName: 'API Usage',
          itemName: 'API Calls',
          charge: {
            id: 'charge-1',
            billableMetric: {
              id: 'metric-1',
              name: 'API Calls Metric',
            },
          },
          chargeFilter: {
            id: 'filter-1',
            invoiceDisplayName: 'Premium Filter',
            values: { tier: ['premium'] },
          },
          groupedBy: { region: 'US-East', env: 'production' },
          trueUpParentFee: null,
          subscription: {
            id: 'sub-1',
          },
          adjustedFee: false,
        },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      // Simulate a fee that was edited and got partial data from previewAdjustedFee mutation
      const currentFees = [
        {
          id: 'fee-1',
          feeType: 'charge',
          invoiceDisplayName: null,
          invoiceName: 'API Usage',
          itemName: 'API Calls',
          // This is what Apollo cache pollution might cause - partial charge data
          charge: {
            id: 'charge-1',
            // billableMetric might be missing or have fewer fields
          },
          chargeFilter: null, // Lost!
          groupedBy: null, // Lost!
          trueUpParentFee: null,
          subscription: {
            id: 'sub-1',
          },
          adjustedFee: true,
        },
      ]

      // Reset the fee
      const result = onDelete('fee-1', currentFees)

      // Verify all display name fields are restored
      const restoredFee = result[0]

      expect(restoredFee.invoiceName).toBe('API Usage')
      expect(restoredFee.itemName).toBe('API Calls')
      expect(restoredFee.charge.billableMetric.name).toBe('API Calls Metric')
      expect(restoredFee.chargeFilter).toBeDefined()
      expect(restoredFee.chargeFilter.invoiceDisplayName).toBe('Premium Filter')
      expect(restoredFee.groupedBy).toEqual({ region: 'US-East', env: 'production' })
    })

    it('should preserve subscription fee display name fields', () => {
      const originalFees = [
        {
          id: 'fee-1',
          feeType: 'subscription',
          invoiceDisplayName: 'Custom Subscription Name',
          subscription: {
            id: 'sub-1',
            plan: {
              id: 'plan-1',
              name: 'Premium Plan',
              interval: 'monthly',
            },
          },
          adjustedFee: false,
        },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      const currentFees = [
        {
          id: 'fee-1',
          feeType: 'subscription',
          invoiceDisplayName: 'Custom Subscription Name',
          // Partial subscription data from mutation
          subscription: {
            id: 'sub-1',
            // plan might be incomplete
          },
          adjustedFee: true,
        },
      ]

      const result = onDelete('fee-1', currentFees)
      const restoredFee = result[0]

      // Note: For subscription fees, display name comes from fee.invoiceDisplayName
      // or falls back to plan data. Both should be preserved.
      expect(restoredFee.invoiceDisplayName).toBe('Custom Subscription Name')
      expect(restoredFee.subscription.plan).toBeDefined()
      expect(restoredFee.subscription.plan.name).toBe('Premium Plan')
      expect(restoredFee.subscription.plan.interval).toBe('monthly')
    })
  })

  describe('Fee update (onAdd) logic', () => {
    /**
     * Simulates the fee update logic from CustomerInvoiceRegenerate.tsx
     */
    const createFeeUpdateHandler = () => {
      const TEMPORARY_ID_PREFIX = 'temporary-id-fee-'

      return {
        onAdd: (
          currentFees: any[],
          previewedFeeData: any,
          input: { feeId?: string; properties?: any },
        ) => {
          const isUpdate = currentFees.some((f) => f.id === input.feeId)

          const calculatedFee = {
            ...previewedFeeData,
            properties: previewedFeeData.properties ?? input.properties,
            id: isUpdate ? input.feeId : `${TEMPORARY_ID_PREFIX}-${Math.random().toString()}`,
            adjustedFee: true,
          }

          if (isUpdate) {
            return currentFees.map((fee) => (fee.id === input.feeId ? calculatedFee : fee))
          }

          return [...currentFees, calculatedFee]
        },
      }
    }

    it('should update existing fee in place', () => {
      const { onAdd } = createFeeUpdateHandler()

      const currentFees = [
        { id: 'fee-1', invoiceDisplayName: 'Original', units: 10 },
        { id: 'fee-2', invoiceDisplayName: 'Other Fee', units: 5 },
      ]

      const previewedData = { invoiceDisplayName: 'Updated', units: 20 }
      const result = onAdd(currentFees, previewedData, { feeId: 'fee-1' })

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('fee-1')
      expect(result[0].invoiceDisplayName).toBe('Updated')
      expect(result[0].units).toBe(20)
      expect(result[0].adjustedFee).toBe(true)
      expect(result[1]).toEqual(currentFees[1]) // Unchanged
    })

    it('should add new fee with temporary ID', () => {
      const { onAdd } = createFeeUpdateHandler()

      const currentFees = [{ id: 'fee-1', invoiceDisplayName: 'Existing', units: 10 }]

      const previewedData = { invoiceDisplayName: 'New Fee', units: 5 }
      const result = onAdd(currentFees, previewedData, { feeId: undefined })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(currentFees[0])
      expect(result[1].id).toContain('temporary-id-fee-')
      expect(result[1].invoiceDisplayName).toBe('New Fee')
      expect(result[1].adjustedFee).toBe(true)
    })

    it('should preserve properties from input when mutation does not return them', () => {
      const { onAdd } = createFeeUpdateHandler()

      const currentFees = [{ id: 'fee-1' }]
      const inputProperties = {
        fromDatetime: '2024-01-01T00:00:00Z',
        toDatetime: '2024-01-31T23:59:59Z',
      }

      // Mutation doesn't return properties
      const previewedData = { invoiceDisplayName: 'Updated', properties: null }
      const result = onAdd(currentFees, previewedData, {
        feeId: 'fee-1',
        properties: inputProperties,
      })

      expect(result[0].properties).toEqual(inputProperties)
    })
  })
})
